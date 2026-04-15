export function getExceptionText(ex: any, prefix?: string) {
  return `${prefix ? `${prefix}: ` : ''}${
    ex?.error?.stack || // wrap
    ex?.error ||
    ex?.stack ||
    ex?.message ||
    ex
  }`;
}
