# Open Policy Agent WebAssembly Module for Deno

Port of the [npm-opa-wasm](https://github.com/open-policy-agent/npm-opa-wasm)
SDK to work with Deno, to use WebAssembly (wasm) compiled [Open Policy
Agent](https://www.openpolicyagent.org/) Rego policies. This project is written
in TypeScript and makes use of ES modules.

## Usage

### Deno

In Deno, the policy wasm binary can be read and loaded with the snippet below.

```ts
import { loadPolicy } from "https://raw.githubusercontent.com/jdfoster/deno-opa-wasm/main/mod.ts"

const f = await Deno.readFile("./wasm/policy.wasm");
const policy = await loadPolicy(f);

policy.setData({ world: "world" });
const r = policy.evaluate({ message: "world" });

console.log(JSON.stringify(r, null, 2));
```

### Compile Open Policy Agent policy to WebAssembly

To use this module, rego policies must be first complied to wasm using the OPA
cli. Running the OPA build command will generate a `bundle.tar.gz` archive
containing the `policy.wasm` file; simply decompress the archive to retrieve the
wasm binary.

```sh
opa build -t wasm -e 'example/hello' ./example/example.rego
```
