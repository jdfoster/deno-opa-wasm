import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { loadPolicy } from "../../mod.ts";
import * as dateFns from "https://cdn.skypack.dev/date-fns";
import * as dateFnsTz from "https://cdn.skypack.dev/date-fns-tz";

async function fetchPolicy() {
  const f = await Deno.readFile("./policy.wasm");
  return loadPolicy(f);
}

Deno.test("library should parse date", async () => {
  const policy = await fetchPolicy();
  const [{ result: { parsedDate } }] = policy.evaluate({});
  assertEquals(parsedDate, 1614504978000000000);
});

Deno.test("library should add day", async () => {
  const policy = await fetchPolicy();
  const [{ result: { addDay } }] = policy.evaluate({});
  assertEquals(addDay, 1614591378000000000);
});

// 'timeAddDate' function is not directly comparable to the Golang std time
// library. The implemented function working adjust hours across daylight saving
// boundaries, whereas Golang does not.
// Deno.test("library should add month", async () => {
//   const policy = await fetchPolicy();
//   const [{ result: { addMonth } }] = policy.evaluate({});
//   console.log(1616924178000000000 - addMonth);
//   assertEquals(addMonth, 1616924178000000000);
// });

Deno.test("library should add year", async () => {
  const policy = await fetchPolicy();
  const [{ result: { addYear } }] = policy.evaluate({});
  assertEquals(addYear, 1646040978000000000);
});
