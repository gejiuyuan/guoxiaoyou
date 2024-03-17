const { toString } = Object.prototype;

export function toStringTag(v: unknown): string {
  return toString.call(v).slice(8, -1);
}

export function isPromise<T = any>(p: unknown): p is Promise<T> {
  return toStringTag(p) === 'Promise';
}
