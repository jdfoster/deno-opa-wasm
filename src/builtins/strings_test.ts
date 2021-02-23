import { assertEquals } from "https://deno.land/std@0.84.0/testing/asserts.ts";
import {
  concat,
  contains,
  endswith,
  indexof,
  lower,
  replace,
  split,
  startswith,
  substring,
} from "./strings.ts";

Deno.test("[builtins.strings] concat", () => {
  const res = concat("/", ["", "foo", "bar", "0", "baz"]);
  assertEquals(res, "/foo/bar/0/baz");
});

Deno.test("[builtins.strings] contains: returns true", () => {
  const res = contains("abcdefgh", "defg");
  assertEquals(res, true);
});

Deno.test("[builtins.strings] contains: returns false", () => {
  const res = contains("abcdefgh", "ac");
  assertEquals(res, false);
});

Deno.test("[builtins.strings] contains: returns false", () => {
  const res = contains("abcdefgh", "zy");
  assertEquals(res, false);
});

Deno.test("[builtins.strings] endswith: returns true", () => {
  const res = endswith("abcdef", "def");
  assertEquals(res, true);
});

Deno.test("[builtins.strings] endswith: returns false", () => {
  const res = endswith("abcdef", "de");
  assertEquals(res, false);
});

Deno.test("[builtins.strings] indexof: returns position", () => {
  const res = indexof("abcdef", "de");
  assertEquals(res, 3);
});

Deno.test("[builtins.strings] indexof: returns -1 for missing", () => {
  const res = indexof("abcdef", "zy");
  assertEquals(res, -1);
});

Deno.test("[builtins.strings] lower: returns lowercase", () => {
  const res = lower("ONE,2,THREE,4");
  assertEquals(res, "one,2,three,4");
});

Deno.test("[builtins.strings] replace: returns expected string", () => {
  const res = replace("1,TWO,3,4", "TWO", "2");
  assertEquals(res, "1,2,3,4");
});

Deno.test("[builtins.strings] split: returns array", () => {
  const res = split("ONE,TWO,THREE,FOUR", ",");
  assertEquals(res, ["ONE", "TWO", "THREE", "FOUR"]);
});

Deno.test("[builtins.strings] startswith: returns true", () => {
  const res = startswith("abcdefg", "abc");
  assertEquals(res, true);
});

Deno.test("[builtins.strings] startswith: returns false", () => {
  const res = startswith("abcdefg", "ac");
  assertEquals(res, false);
});

Deno.test("[builtins.strings] substring: returns excepted string", () => {
  const res = substring("one,two,three,four", 4, 3);
  assertEquals(res, "two");
});

Deno.test("[builtins.strings] substring: return full string", () => {
  const res = substring("one,two,three,four", 0, 20);
  assertEquals(res, "one,two,three,four");
});
