import { builtins } from "./builtins.ts";

const textEn = new TextEncoder();
const textDe = new TextDecoder();

type BuiltinByNames = Record<string, number>;
type BuiltinByIds = Record<number, string>;
type BuiltinId = keyof BuiltinByIds;

interface WasmEnvironment {
  instance: WebAssembly.Instance;
  builtinByNames: BuiltinByNames;
  builtinByIds: BuiltinByIds;
}

function stringDecoder(mem: WebAssembly.Memory) {
  return function (addr: number) {
    const arr = new Int8Array(mem.buffer);
    let s = "";

    while (arr[addr] !== 0) {
      s += String.fromCharCode(arr[addr++]);
    }

    return s;
  };
}

function _loadJSON(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  value: any,
) {
  if (value === undefined) {
    throw "unable to load undefined value into memory";
  }

  const str = textEn.encode(JSON.stringify(value));
  const opaMalloc = wasmInstance.exports.opa_malloc as CallableFunction;
  const rawAddr: number = opaMalloc(str.length);
  const buf = new Uint8Array(memory.buffer);

  str.forEach((value, i) => {
    buf[rawAddr + i] = value;
  });

  const opaJsonParse = wasmInstance.exports.opa_json_parse as CallableFunction;
  const parsedAddr: number = opaJsonParse(rawAddr, str.length);

  if (parsedAddr === 0) {
    throw "failed to parse json value";
  }
  return parsedAddr;
}

function _dumpJSON(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  addr: number,
) {
  const opaJsonDump = wasmInstance.exports.opa_json_dump as CallableFunction;
  const rawAddr: number = opaJsonDump(addr);
  const buf = new Uint8Array(memory.buffer);
  const endAddr = buf.indexOf(0);
  const str = buf.slice(rawAddr, endAddr);

  return JSON.parse(textDe.decode(str));
}

function _builtinCall(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  builtinById: BuiltinByIds,
  builtinId: BuiltinId,
  ...rest: any[]
) {
  const builtinName = builtinById[builtinId];

  if (!(builtinId in builtins)) {
    throw {
      message: "not implemented: built-in function " +
        builtinId +
        ": " +
        builtinById[builtinId],
    };
  }

  const builtin = builtins[builtinName];
  const args = rest.map((arg) => _dumpJSON(wasmInstance, memory, arg));
  const result = builtin(...args);

  return _loadJSON(wasmInstance, memory, result);
}

async function _loadPolicy(
  policy_wasm: BufferSource,
  memory: WebAssembly.Memory,
) {
  const addr2string = stringDecoder(memory);

  let env: Partial<WasmEnvironment> = {};

  const wasm = await WebAssembly.instantiate(policy_wasm, {
    env: {
      memory: memory,
      opa_abort: function (addr: number) {
        throw addr2string(addr);
      },
      opa_println: function (addr: number) {
        console.log(addr2string(addr));
      },
      opa_builtin0: function (
        builtinId: number,
        ctx: unknown,
      ) {
        return _builtinCall(
          env.instance!,
          memory,
          env.builtinByIds!,
          builtinId,
        );
      },
      opa_builtin1: function (
        builtinId: number,
        ctx: unknown,
        _1: any,
      ) {
        return _builtinCall(
          env.instance!,
          memory,
          env.builtinByIds!,
          builtinId,
          _1,
        );
      },
      opa_builtin2: function (
        builtin_id: number,
        ctx: unknown,
        _1: any,
        _2: any,
      ) {
        return _builtinCall(
          env.instance!,
          memory,
          env.builtinByIds!,
          builtin_id,
          _1,
          _2,
        );
      },
      opa_builtin3: function (
        builtin_id: number,
        ctx: unknown,
        _1: any,
        _2: any,
        _3: any,
      ) {
        return _builtinCall(
          env.instance!,
          memory,
          env.builtinByIds!,
          builtin_id,
          _1,
          _2,
          _3,
        );
      },
      opa_builtin4: function (
        builtin_id: number,
        ctx: unknown,
        _1: any,
        _2: any,
        _3: any,
        _4: any,
      ) {
        return _builtinCall(
          env.instance!,
          memory,
          env.builtinByIds!,
          builtin_id,
          _1,
          _2,
          _3,
          _4,
        );
      },
    },
  });

  env.instance = wasm.instance;

  const builtinsInst = env.instance.exports.builtins as CallableFunction;
  const builtinsAddr: number = builtinsInst();

  env.builtinByNames = _dumpJSON(
    env.instance,
    memory,
    builtinsAddr,
  );

  env.builtinByIds = Object.fromEntries(
    Object.entries(builtins).map((([k, v]) => [Number(v), String(k)])),
  );

  return wasm;
}

class LoadedPolicy {
  private mem: WebAssembly.Memory;
  private wasmInstance: WebAssembly.Instance;
  private exports: WebAssembly.Exports;
  private dataAddr: number;
  private baseHeapPtr: number;
  private dataHeapPtr: number;
  private eval: (ctxAddr: number) => number;
  private opa_eval_ctx_get_result: (ctxAddr: number) => number;
  private opa_eval_ctx_new: () => number;
  private opa_eval_ctx_set_data: (ctxAddr: number, valueAddr: number) => void;
  private opa_eval_ctx_set_input: (ctxAddr: number, valueAddr: number) => void;
  private opa_heap_ptr_get: () => number;
  private opa_heap_ptr_set: (addr: number) => void;

  constructor(
    policy: WebAssembly.WebAssemblyInstantiatedSource,
    memory: WebAssembly.Memory,
  ) {
    this.mem = memory;
    this.wasmInstance = policy.instance;
    this.exports = this.wasmInstance.exports;
    this.eval = this.getExport("eval");
    this.opa_eval_ctx_get_result = this.getExport("opa_eval_ctx_get_result");
    this.opa_eval_ctx_new = this.getExport("opa_eval_ctx_new");
    this.opa_eval_ctx_set_data = this.getExport("opa_eval_ctx_set_data");
    this.opa_eval_ctx_set_input = this.getExport("opa_eval_ctx_set_input");
    this.opa_heap_ptr_get = this.getExport("opa_heap_ptr_get");
    this.opa_heap_ptr_set = this.getExport("opa_heap_ptr_set");
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, {});
    this.baseHeapPtr = this.opa_heap_ptr_get();
    this.dataHeapPtr = this.baseHeapPtr;
  }

  private getExport(key: string): any {
    return this.exports[key];
  }

  evaluate(input: any) {
    this.opa_heap_ptr_set(this.dataHeapPtr);
    const inputAddr = _loadJSON(this.wasmInstance, this.mem, input);
    const ctxAddr = this.opa_eval_ctx_new();
    this.opa_eval_ctx_set_input(ctxAddr, inputAddr);
    this.opa_eval_ctx_set_data(ctxAddr, this.dataAddr);
    this.eval(ctxAddr);
    const resultAddr = this.opa_eval_ctx_get_result(ctxAddr);

    return _dumpJSON(this.wasmInstance, this.mem, resultAddr);
  }

  evalBool(input: any) {
    const rs: boolean[] = this.evaluate(input);
    return rs && rs.length === 1 && rs[0] === true;
  }

  setData(data: any) {
    this.opa_heap_ptr_set(this.baseHeapPtr);
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
    this.dataHeapPtr = this.opa_heap_ptr_get();
  }
}
