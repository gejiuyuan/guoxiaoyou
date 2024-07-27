export function isGetSetPropertyDescriptor(
  descriptor: TypedPropertyDescriptor<any>,
): descriptor is {
  get: NonNullable<TypedPropertyDescriptor<any>['get']>;
  set: NonNullable<TypedPropertyDescriptor<any>['set']>;
} & Pick<TypedPropertyDescriptor<any>, 'configurable' | 'enumerable' | 'writable'> {
  return typeof descriptor.get === 'function' && typeof descriptor.set === 'function';
}

export function isPropertyKey(prop: unknown): prop is PropertyKey {
  const typeofValue = typeof prop;
  return typeofValue === 'string' || typeofValue === 'number' || typeofValue === 'symbol';
}

interface IGetSetWatchDecoratorOptions<T extends object> {
  getter: (this: T, prop: PropertyKey, value: unknown) => void;
  setter: (this: T, prop: PropertyKey, newValue: unknown, oldValue: unknown) => void;
  accessor?: (target: T, prop: PropertyKey) => void;
}

export function createGetSetDecorator<T extends object>({
  getter,
  setter,
  accessor,
}: IGetSetWatchDecoratorOptions<T>) {
  return (target: T, property: PropertyKey, descriptor: PropertyDescriptor) => {
    if (descriptor === void 0) {
      if (property === void 0) {
        // Class类装饰器
        return;
      } else if (isPropertyKey(property)) {
        // 属性装饰器
      }
    } else {
      if (Object.prototype.toString.call(descriptor).slice(8, -1) === 'Object') {
        // get set访问器装饰器
        const hasGetter = typeof descriptor.get === 'function';
        const hasSetter = typeof descriptor.set === 'function';
        if (hasGetter || hasSetter) {
          const { get: originalGet } = descriptor;
          const prop = originalGet!.name.split(' ')[1];
          accessor && accessor(target, prop);
          if (hasGetter) {
            descriptor.get = function (this: T) {
              const value = originalGet!.call(this);
              getter.call(this, prop, value);
              return value;
            };
          }
          if (hasSetter) {
            const { set: originalSet } = descriptor;
            descriptor.set = function (this: T, newValue: any) {
              const oldValue = originalGet!.call(this);
              if (newValue !== oldValue) {
                originalSet!.call(this, newValue);
                setter.call(this, prop, newValue, oldValue);
              }
            };
          }
        }
      } else {
        // 方法装饰器
      }
    }
  };
}
