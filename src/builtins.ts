import * as _BuiltinFuncs from "./builtins/mod.ts";

// Rename builtins to match expected OPA builtin name.
const renameMapping: Record<string, string> = {
  regexSplit: "regex.split",
  timeAddDate: "time.add_date",
  timeDate: "time.date",
  timeNowNS: "time.now_ns",
  timeParseRfc3339NS: "time.parse_rfc3339_ns",
};

type BuiltinFuncs = Record<string, CallableFunction>;
const BuiltinFuncs = _BuiltinFuncs as BuiltinFuncs;

export const builtins = Object.fromEntries(
  Object.entries(BuiltinFuncs).map(([k, v]) => [
    k in renameMapping ? renameMapping[k] : k,
    v,
  ]),
);
