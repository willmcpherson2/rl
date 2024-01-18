const dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(
  "en-AU",
  {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "medium",
  },
);

export function log(msg: object): void {
  console.log(JSON.stringify(
    {
      time: dateFormat.format(new Date()),
      ...msg,
    },
    null,
    2,
  ));
}

export function debug<T>(first: T, ...rest: T[]): T {
  console.debug(first, ...rest);
  const last = rest.at(-1) ?? first;
  return last;
}

export function unwrap<T>(x: T | null | undefined, msg: string): T {
  if (x) {
    return x;
  } else {
    throw new Error(msg);
  }
}
