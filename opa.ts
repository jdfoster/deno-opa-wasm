import { builtins } from "./builtins.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type BuiltinByIds = Record<number, string>;
type BuiltinId = keyof BuiltinByIds;

interface WasmEnvironment {
  instance: WebAssembly.Instance;
  builtinByIds: BuiltinByIds;
}

interface OpaWasmExports {
  eval: (ctxAddr: number) => number;
  builtins: () => number;
  entrypoints: () => number;
  opa_eval_ctx_new: () => number;
  opa_eval_ctx_set_input: (ctxAddr: number, valueAddr: number) => void;
  opa_eval_ctx_set_data: (ctxAddr: number, valueAddr: number) => void;
  opa_eval_ctx_set_entrypoint: (ctxAddr: number, entrypointId: number) => void;
  opa_eval_ctx_get_result: (ctxAddr: number) => number;
  opa_malloc: (size: number) => number;
  opa_json_parse: (strAddr: number, size: number) => number;
  opa_value_parse: (strAddr: number, size: number) => number;
  opa_json_dump: (valueAddr: number) => number;
  opa_value_dump: (valueAddr: number) => number;
  opa_heap_ptr_set: (addr: number) => void;
  opa_heap_ptr_get: () => number;
  opa_value_add_path: (
    baseValueAddr: number,
    pathValueAddr: number,
    valueAddr: number,
  ) => number;
  opa_value_remove_path: (
    baseValueAddr: number,
    pathValueAddr: number,
  ) => number;
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

  const exports: OpaWasmExports = wasmInstance.exports as any;
  const str = encoder.encode(JSON.stringify(value));
  const rawAddr = exports.opa_malloc(str.length);
  const buf = new Uint8Array(memory.buffer);

  str.forEach((value, i) => {
    buf[rawAddr + i] = value;
  });

  const parsedAddr = exports.opa_json_parse(rawAddr, str.length);

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
  const exports: OpaWasmExports = wasmInstance.exports as any;
  const rawAddr = exports.opa_json_dump(addr);
  const buf = new Uint8Array(memory.buffer);
  const endAddr = buf.indexOf(0, rawAddr);
  const str = buf.slice(rawAddr, endAddr);

  return JSON.parse(decoder.decode(str));
}

function _builtinCall(
  wasmInstance: WebAssembly.Instance,
  memory: WebAssembly.Memory,
  builtinById: BuiltinByIds,
  builtinId: BuiltinId,
  ...rest: any[]
) {
  const builtinName = builtinById[builtinId];

  if (!(builtinName in builtins)) {
    throw new Error(
      `[NotImplemented] built-in function builtinId: ${builtinById[builtinId]}`,
    );
  }

  const builtin = builtins[builtinName];
  const args = rest.map((arg) => _dumpJSON(wasmInstance, memory, arg));
  const result = builtin(...args);

  return result !== undefined && _loadJSON(wasmInstance, memory, result);
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
      opa_abort(
        addr: number,
      ) {
        throw addr2string(addr);
      },
      opa_println(
        addr: number,
      ) {
        console.log(addr2string(addr));
      },
      opa_builtin0(
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
      opa_builtin1(
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
      opa_builtin2(
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
      opa_builtin3(
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
      opa_builtin4(
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

  const exports: OpaWasmExports = env.instance.exports as any;
  const builtinsAddr: number = exports.builtins();
  const builtinByNames = _dumpJSON(
    env.instance,
    memory,
    builtinsAddr,
  );

  env.builtinByIds = Object.fromEntries(
    Object.entries(builtinByNames!).map(
      (([k, v]) => [Number(v), String(k)]),
    ),
  );

  return wasm;
}

class LoadedPolicy {
  private mem: WebAssembly.Memory;
  private wasmInstance: WebAssembly.Instance;
  private exports: OpaWasmExports;
  private dataAddr: number;
  private baseHeapPtr: number;
  private dataHeapPtr: number;

  constructor(
    policy: WebAssembly.WebAssemblyInstantiatedSource,
    memory: WebAssembly.Memory,
  ) {
    this.mem = memory;
    this.wasmInstance = policy.instance;
    this.exports = this.wasmInstance.exports as any;
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, {});
    this.baseHeapPtr = this.exports.opa_heap_ptr_get();
    this.dataHeapPtr = this.baseHeapPtr;
  }

  evaluate(input: any) {
    this.exports.opa_heap_ptr_set(this.dataHeapPtr);
    const inputAddr = _loadJSON(this.wasmInstance, this.mem, input);
    const ctxAddr = this.exports.opa_eval_ctx_new();
    this.exports.opa_eval_ctx_set_input(ctxAddr, inputAddr);
    this.exports.opa_eval_ctx_set_data(ctxAddr, this.dataAddr);
    this.exports.eval(ctxAddr);
    const resultAddr = this.exports.opa_eval_ctx_get_result(ctxAddr);

    return _dumpJSON(this.wasmInstance, this.mem, resultAddr);
  }

  evaluateToBool(input: any) {
    const rs: boolean[] = this.evaluate(input);
    return rs && rs.length === 1 && rs[0] === true;
  }

  setData(data: any) {
    this.exports.opa_heap_ptr_set(this.baseHeapPtr);
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
    this.dataHeapPtr = this.exports.opa_heap_ptr_get();
  }
}

export async function loadPolicy(regoWasm: BufferSource) {
  const memory = new WebAssembly.Memory({ initial: 5 });
  const policy = await _loadPolicy(regoWasm, memory);
  return new LoadedPolicy(policy, memory);
}
