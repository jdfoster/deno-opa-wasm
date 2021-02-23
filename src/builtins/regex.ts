export const re_match = (
  pattern: string,
  value: string,
) => RegExp(pattern).test(value);

export const regexSplit = (
  pattern: string,
  s: string,
) => s.split(RegExp(pattern));
