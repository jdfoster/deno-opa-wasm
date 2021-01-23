import { assertEquals } from "https://deno.land/std@0.84.0/testing/asserts.ts";
import { to_number } from "./conversions.ts";

Deno.test("[builtins.conversions] to_number", () => {
  const res = [
    to_number("-42.0"),
    to_number(false),
    to_number(100.1),
    to_number(null),
    to_number(true),
  ];

  [-42, 0, 100.1, 0, 1].forEach((x, i) => assertEquals(res[i], x));
});
