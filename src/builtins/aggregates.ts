export const all = (
  arr: boolean[],
) => (arr.length === 0 ? true : arr.every((v) => v === true));

export const any = (
  arr: boolean[],
) => (arr.length === 0 ? false : arr.includes(true));

export const count = (
  arr: any[],
) => arr.length;

export const max = (
  arr: number[],
) => Math.max(...arr);

export const min = (
  arr: number[],
) => Math.min(...arr);

export const product = (
  arr: number[],
) => arr.reduce((total, num) => total * num, 1);

export const sort = (
  arr: any[],
) => [...arr].sort();

export const sum = (
  arr: number[],
) => arr.reduce((a, b) => a + b, 0);
