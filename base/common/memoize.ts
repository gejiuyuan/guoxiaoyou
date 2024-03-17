export function memoize(_target: any, key: PropertyKey, descriptor: PropertyDescriptor) {
  let fnKey: 'value' | 'get' | null = null;
  let fn: Function | null = null;

  if (typeof descriptor.value === 'function') {
    fnKey = 'value';
    fn = descriptor.value;
  } else if (typeof descriptor.get === 'function') {
    fnKey = 'get';
    fn = descriptor.get;
  }

  if (!fn) {
    throw new Error('@memoize不支持');
  }

  const memoizeKey = `@memoize-${String(key)}`;
  descriptor[fnKey!] = function (this: InstanceType<typeof _target>, ...args: unknown[]) {
    if (!this.hasOwnProperty(memoizeKey)) {
      Object.defineProperty(this, memoizeKey, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: fn!.apply(this, args),
      });
    }

    return this[memoizeKey];
  };
}
