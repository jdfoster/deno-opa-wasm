import { loadPolicy } from "../mod.ts";

const f = await Deno.readFile("./wasm/policy.wasm");
const policy = await loadPolicy(f);

policy.setData({ world: "world" });
const r = policy.evaluate({ message: "world" });
console.log(JSON.stringify(r, null, 2));
