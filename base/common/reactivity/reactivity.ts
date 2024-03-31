import { EMPTY_OBJECT, NOOP } from '@base/common/constants';
import { DoublyLinkedList } from '@base/common/structure/doubleLinkedList';

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

export function createGetSetWatchDecorator<T extends object>({
  getter,
  setter,
  accessor = NOOP,
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
        if (isGetSetPropertyDescriptor(descriptor)) {
          const { get: originalGet, set: originalSet } = descriptor;
          const prop = descriptor.get.name.split(' ')[1];
          accessor(target, prop);
          descriptor.get = function (this: T) {
            const value = originalGet.call(this);
            getter.call(this, prop, value);
            return value;
          };
          descriptor.set = function (this: T, newValue: any) {
            const oldValue = originalGet.call(this);
            if (newValue !== oldValue) {
              originalSet.call(this, newValue);
              setter.call(this, prop, newValue, oldValue);
            }
          };
        }
      } else {
        // 方法装饰器
      }
    }
  };
}

/**
 * watch api执行选项
 */
interface WatcherOptions {
  /**
   * 刷新时机（触发时机）
   */
  flush?: 'async' | 'sync';

  /**
   * 是否立即执行
   */
  immediate?: boolean;

  /**
   * 是否只触发一次
   */
  once?: boolean;
}

type TStopWatch = () => void;

const INITIAL_WATCHER_VALUE = Object.freeze(Object());

class Effect {
  clear() {
    const { deps } = this;
    deps.forEach((watchers) => {
      watchers.delete(this);
    });
    deps.clear();
  }

  readonly deps = new Set<Set<typeof this>>();

  constructor(
    public readonly func: (...args: any[]) => any,
    /**
     * 异步调度器（优先级高于run）
     */
    public readonly scheduler: Function | null = null,
  ) {}
}

class Reactivity {
  readonly #targetPropDeps = new WeakMap<object, Map<PropertyKey, Set<Effect>>>();

  readonly #trackedTargets = new WeakMap<object, 0>();

  readonly #effectStack = new DoublyLinkedList<Effect>();

  #activeEffect: Effect | null = null;

  readonly reactive: ReturnType<typeof createGetSetWatchDecorator>;

  private runEffect(effect: Effect) {
    if (!this.#effectStack.has(effect)) {
      try {
        this.#effectStack.push((this.#activeEffect = effect));
        return effect.func();
      } finally {
        this.#effectStack.pop();
        this.#activeEffect = this.#effectStack.size
          ? this.#effectStack.tail!.value
          : null;
      }
    }
  }

  /**
   * watch响应式侦听器
   *
   * @template T
   * @param {() => T} reactiveTarget 获取要侦听的响应式数据
   * @param {((newValue: T, oldValue: T | undefined) => any)} effect 响应式数据更新时，需要处理的任务
   * @param {WatcherOptions} [options] 执行选项
   * @return {*}  {TStopWatch}
   * @memberof Reactivity
   */
  watch<T>(
    reactiveTarget: () => T,
    effect: (newValue: T, oldValue: T | undefined) => any,
    options?: WatcherOptions,
  ): TStopWatch;
  watch<T extends object>(
    reactiveTarget: T,
    effect: (newValue: Partial<T>, oldValue: Partial<T> | undefined) => any,
    options?: WatcherOptions,
  ): TStopWatch;
  watch<T>(
    reactiveTarget: (() => T) | T,
    effect: any,
    options: WatcherOptions = EMPTY_OBJECT,
  ): TStopWatch {
    // 如果cb不是函数，终止后续执行
    if (typeof effect !== 'function') {
      // eslint-disable-next-line no-console
      console.error(`The second parameter of 'watch' ———— 'cb' must be a function!`);
      return NOOP;
    }

    // 默认触发机制：响应式数据更新后，异步执行回调任务
    const { flush = 'sync', immediate = false, once = false } = options;

    if (!(flush === 'sync' || flush === 'async')) {
      // eslint-disable-next-line no-console
      console.warn(
        `The 'flush' parameter value of 'watch' options should be one of the two options: ${['sync', 'async'].join('、')}`,
      );
    }

    if (Object(reactiveTarget) === reactiveTarget) {
      const _proto = Object.getPrototypeOf(reactiveTarget);
      const _targetTracker = this.#trackedTargets.has(_proto)
        ? () => {
            const descriptors = Object.getOwnPropertyDescriptors(_proto);
            return Object.keys(descriptors).reduce((res, prop) => {
              const desc = descriptors[prop];
              if (desc.get) {
                Reflect.set(res, prop, desc.get.call(reactiveTarget));
              }
              return res;
            }, Object());
          }
        : typeof reactiveTarget === 'function'
          ? reactiveTarget
          : null;

      if (_targetTracker) {
        // 旧值
        let oldValue: any = INITIAL_WATCHER_VALUE;

        function stopWatch() {
          if (reactiveEffect) {
            reactiveEffect.clear();
            reactiveEffect = null!;
            oldValue = null;
          }
        }

        const job = () => {
          const newValue = this.runEffect(reactiveEffect);
          effect(newValue, oldValue === INITIAL_WATCHER_VALUE ? void 0 : oldValue);
          if (once) {
            stopWatch();
          } else {
            oldValue = newValue;
          }
        };

        let reactiveEffect = new Effect(
          _targetTracker as any,
          flush === 'async' ? () => Promise.resolve().then(job) : job,
        );

        // 如果需要立即执行
        if (immediate) {
          reactiveEffect.scheduler!();
        } else {
          oldValue = this.runEffect(reactiveEffect);
        }
        return stopWatch;
      }
    }

    return NOOP;
  }

  constructor() {
    const _this = this;
    this.reactive = createGetSetWatchDecorator({
      accessor: (target) => {
        if (!this.#trackedTargets.has(target)) {
          this.#trackedTargets.set(target, 0);
        }
      },
      getter(prop) {
        if (!_this.#activeEffect) {
          return;
        }
        let item = _this.#targetPropDeps.get(this);
        if (!item) {
          _this.#targetPropDeps.set(this, (item = new Map()));
        }

        let watchers = item.get(prop);
        if (!watchers) {
          item.set(prop, (watchers = new Set()));
        }

        watchers.add(_this.#activeEffect);
        _this.#activeEffect.deps.add(watchers);
      },
      setter(prop) {
        const item = _this.#targetPropDeps.get(this);
        if (item) {
          const watchers = item.get(prop);
          if (watchers) {
            for (const effect of new Set(watchers)) {
              effect.scheduler ? effect.scheduler() : _this.runEffect(effect);
            }
          }
        }
      },
    });
  }
}

export function createReactivity() {
  const reactivity = new Reactivity();
  return {
    watch: reactivity.watch.bind(reactivity),
    reactive: reactivity.reactive,
  };
}
