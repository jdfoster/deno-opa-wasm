import { sprintf as denoSprintf } from "https://deno.land/std/fmt/printf.ts";

export const concat = (
  delimiter: string,
  arr: any[],
) => arr.join(delimiter);

export const contains = (
  s: string,
  search: string,
) => s.includes(search);

export const endswith = (
  s: string,
  search: string,
) => s.endsWith(search);

export const indexof = (
  s: string,
  search: string,
) => s.indexOf(search);

export const lower = (
  s: string,
) => s.toLowerCase();

export const replace = (
  s: string,
  searchValue: string,
  newValue: string,
) => s.replace(searchValue, newValue);

export const split = (
  s: string,
  delimiter: string,
) => s.split(delimiter);

export const startswith = (
  s: string,
  search: string,
) => s.startsWith(search);

export const substring = (
  s: string,
  start: number,
  length: number,
) => s.substr(start, length);

export const sprintf = (
  s: string,
  values: any[],
) => denoSprintf(s, ...values);
