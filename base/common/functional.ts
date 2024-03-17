export function once<T extends Function>(this: unknown, fn: T): T {
  const _this = this;
  let didCall = false;
  let result: unknown;
  return function () {
    if (didCall) {
      return result;
    }
    didCall = true;
    return (result = fn.call(_this, arguments));
  } as unknown as T;
}

export function isUndef(arg: unknown): arg is null | undefined {
  return arg === null || arg === void 0;
}
