import {
  add,
  getDay,
  getMonth,
  getYear,
  parseISO,
} from "https://cdn.skypack.dev/date-fns";

const MS_TO_NS = 1_000_000;

const fromJSDate = (d: Date) => d.getTime() * MS_TO_NS;
const fromNS = (n: number) => new Date(n / MS_TO_NS);

export const timeNowNS = () => fromJSDate(new Date());

export const timeParseRfc3339NS = (s: string) => fromJSDate(parseISO(s));

export const timeDate = (n: number) => {
  const d = fromNS(n);
  return [getYear(d), getMonth(d), getDay(d)];
};

// 'timeAddDate' function is not directly comparable to the Golang std time
// library. The implemented function working adjust hours across daylight saving
// boundaries, whereas Golang does not.
export const timeAddDate = (
  n: number,
  years: number,
  months: number,
  days: number,
) => fromJSDate(add(fromNS(n), { years, months, days }));
