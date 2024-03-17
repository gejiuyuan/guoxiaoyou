import { once } from '@base/common/functional';
import { Iterable } from '@base/common/iterable';

export interface IDisposable {
  dispose(): any;
}

export function isDisposable<T extends object>(thing: T): thing is T & IDisposable {
  return (
    typeof (thing as IDisposable).dispose === 'function' &&
    (thing as IDisposable).dispose.length === 0
  );
}

export function dispose<T extends IDisposable>(disposes: T): T;
export function dispose<T extends IDisposable, Itor extends Iterable<T> = Iterable<T>>(
  disposes: Itor,
): Itor;
export function dispose<T extends IDisposable>(disposes: Array<T>): Array<T>;
export function dispose<T extends IDisposable>(
  disposes: ReadonlyArray<T>,
): ReadonlyArray<T>;
export function dispose<T extends IDisposable>(arg: T | Iterable<T>): any {
  if (Iterable.is(arg)) {
    const errs = [];
    for (const item of arg) {
      if (item) {
        try {
          item.dispose();
        } catch (err) {
          errs.push(err);
        }
      }
    }
    if (errs.length === 1) {
      throw errs[0];
    } else if (errs.length > 1) {
      throw new AggregateError(errs);
    }
    return Array.isArray(arg) ? [] : arg;
  } else if (arg) {
    arg.dispose();
    return arg;
  }
}

export function toDisposable(fn: () => any): IDisposable {
  return {
    dispose: once(() => {
      fn();
    }),
  };
}

export class DisposableStore implements IDisposable {
  private readonly store = new Set<IDisposable>();

  private _isDisposed = false;

  public get isDisposed() {
    return this._isDisposed;
  }

  add<T extends IDisposable>(disposble: T): T {
    if (disposble) {
      if (Object.is(this, disposble)) {
        throw new Error(`Can't add a disposable on itself!`);
      }
      if (!this._isDisposed) {
        this.store.add(disposble);
      }
    }
    return disposble;
  }

  delete<T extends IDisposable>(disposble: T): T {
    if (disposble) {
      if (Object.is(this, disposble)) {
        throw new Error(`Can't delete a disposable on itself!`);
      }

      this.store.delete(disposble);
    }
    return disposble;
  }

  dispose() {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this.clear();
  }

  clear() {
    if (this.store.size) {
      try {
        this.store.forEach((item) => item.dispose());
      } finally {
        this.store.clear();
      }
    }
  }
}

export class Disposable implements IDisposable {
  static readonly None = Object.freeze<IDisposable>({ dispose() {} });

  readonly #store = new DisposableStore();

  dispose() {
    this.#store.dispose();
  }

  clear() {
    this.#store.clear();
  }

  addDisposale<T extends IDisposable>(item: T): T {
    return this.#store.add(item);
  }

  deleteDisposable<T extends IDisposable>(item: T): T {
    if (item) {
      if (item instanceof Disposable) {
        item.clear();
      } else {
        item.dispose();
      }
      this.#store.delete(item);
    }
    return item;
  }

  static doFinally(fn: (store: DisposableStore) => void) {
    const store = new DisposableStore();
    try {
      fn(store);
    } finally {
      store.dispose();
    }
  }
}

export class MutableDisposable<T extends IDisposable> implements IDisposable {
  private _value?: T;

  private _isDisposed = false;

  get value() {
    return this._isDisposed ? void 0 : this._value;
  }

  set value(val: T | undefined) {
    if (this._isDisposed || this._value === val) {
      return;
    }
    this._value?.dispose();
    this._value = val;
  }

  clear() {
    this.value = void 0;
  }

  clearAndLeak() {
    const oldValue = this._value;
    this._value = void 0;
    return oldValue;
  }

  dispose() {
    this._isDisposed = true;
    if (this._value) {
      this._value.dispose();
      this._value = void 0;
    }
  }
}

export class RefCountedDisposable {
  private counter = 1;
  constructor(private readonly disposable: IDisposable) {}

  acquire() {
    this.counter++;
    return this;
  }

  release() {
    if (--this.counter === 0) {
      this.disposable.dispose();
    }
    return this;
  }
}

export class DisposableMap<K, V extends IDisposable = IDisposable>
  implements IDisposable
{
  private readonly store = new Map<K, V>();

  private _isDisposed = false;

  dispose() {
    this._isDisposed = true;
    this.clearAndDispose();
  }

  clearAndDispose() {
    if (this.store.size) {
      try {
        dispose(this.store.values());
      } finally {
        this.store.clear();
      }
    }
  }

  deleteAndDispose(key: K) {
    this.store.get(key)?.dispose();
    this.store.delete(key);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.store[Symbol.iterator]();
  }

  get(key: K) {
    return this.store.get(key);
  }

  has(key: K) {
    return this.store.has(key);
  }

  set(key: K, value: V, isDispose = true) {
    if (this._isDisposed) {
      return;
    }

    if (isDispose) {
      this.get(key)?.dispose();
    }
    this.store.set(key, value);
  }
}
