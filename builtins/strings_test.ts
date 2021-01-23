import { assertEquals } from "https://deno.land/std@0.84.0/testing/asserts.ts";
import { concat, contains } from "./strings.ts";

Deno.test("[builtins.strings] contains: returns true", () => {
  const res = contains("abcdefgh", "defg");
  assertEquals(res, true);
});

Deno.test("[builtins.strings] contains: returns false", () => {
  const res = contains("abcdefgh", "ac");
  assertEquals(res, false);
});

Deno.test("[builtins.strings] concat", () => {
  const res = concat("/", ["", "foo", "bar", "0", "baz"]);
  assertEquals(res, "/foo/bar/0/baz");
});
