import { loadPolicy } from "../opa.ts";

const f = await Deno.readFile("./policy.wasm");
const policy = await loadPolicy(f);

policy.setData({ world: "world" });
const r = policy.evaluate({ message: "not world" });
console.log(JSON.stringify(r, null, 2));
