import * as BuiltinFuncs from "./builtins/mod.ts";

// Rename builtins to match expected OPA builtin name.
const renameMapping: Record<string, string> = {
  regexSplit: "regex.split",
};

type BuiltinFuncs = Record<string, CallableFunction>;

export const builtins = Object.fromEntries(
  Object.entries(BuiltinFuncs as BuiltinFuncs).map((
    [k, v],
  ) => [k in renameMapping ? renameMapping[k] : k, v]),
);
