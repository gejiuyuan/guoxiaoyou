import { once } from '@base/common/functional';
import { Iterable } from '@base/common/iterable';

/**
 * 一个IReleasable可能被多个Releasable模块所注册，当其中一个Releasable在释放此IReleasable时，
 * 注册了它的其他Releasable也要释放它
 */
const REF_RELEASABLE_SYMBOL = Symbol('ref-releasable');

export interface IReleasable {
  release(): any;
  [REF_RELEASABLE_SYMBOL]?: Set<Releasable>;
}

export function isReleasable<T extends object>(thing: T): thing is T & IReleasable {
  return (
    typeof (thing as IReleasable).release === 'function' &&
    (thing as IReleasable).release.length === 0
  );
}

export function release<T extends IReleasable>(releases: T): T;
export function release<T extends IReleasable, I extends Iterable<T> = Iterable<T>>(
  releases: I,
): I;
export function release<T extends IReleasable>(releases: Array<T>): Array<T>;
export function release<T extends IReleasable>(
  releases: ReadonlyArray<T>,
): ReadonlyArray<T>;
export function release<T extends IReleasable>(arg: T | Iterable<T>): any {
  if (Iterable.is(arg)) {
    const errs = [];
    for (const item of arg) {
      if (item) {
        try {
          item.release();
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
    arg.release();
    return arg;
  }
}

export function toReleasable(fn: () => any): IReleasable {
  return {
    release: once(fn),
  };
}

export class Releasable<R extends IReleasable = IReleasable> implements IReleasable {
  static readonly None = Object.freeze<IReleasable>({ release() {} });

  readonly #store = new Set<R>();

  release() {
    if (this.#store.size) {
      try {
        for (const item of this.#store) {
          item.release();
        }
      } finally {
        this.#store.clear();
      }
    }
  }

  collect<T extends R>(releasable: T): T {
    if (releasable) {
      if (Object.is(this, releasable)) {
        throw new Error(`Can't add a releasable on itself!`);
      }
      if (!this.#store.has(releasable)) {
        this.#store.add(releasable);
        this.#recordRefReleasable(releasable);
      }
    }
    return releasable;
  }

  releaseOne<T extends R>(releasable: T, callRelease: boolean = true): T {
    if (this.#store.has(releasable)) {
      this.#store.delete(releasable);
      this.#releaseRefReleasable(releasable);
      callRelease && releasable.release();
    }
    return releasable;
  }

  #recordRefReleasable(releasable: IReleasable) {
    let refs = Reflect.get(releasable, REF_RELEASABLE_SYMBOL);
    if (!refs) {
      Reflect.set(releasable, REF_RELEASABLE_SYMBOL, (refs = new Set()));
    }
    refs.add(this);
  }

  #releaseRefReleasable(releasable: IReleasable) {
    const refs = Reflect.get(releasable, REF_RELEASABLE_SYMBOL);
    if (refs) {
      for (const refReleasable of refs) {
        refReleasable.releaseOne(releasable, false);
      }
      refs.clear();
      Reflect.deleteProperty(releasable, REF_RELEASABLE_SYMBOL);
    }
  }

  static do(fn: (store: Releasable) => void) {
    const store = new Releasable();
    try {
      fn(store);
    } finally {
      store.release();
    }
  }
}

export class RefCountedReleasable implements IReleasable {
  #counter = 1;

  readonly #releasable: IReleasable;

  constructor(releasable: IReleasable) {
    this.#releasable = releasable;
  }

  acquire() {
    this.#counter++;
    return this;
  }

  release() {
    if (--this.#counter === 0) {
      this.#releasable.release();
    }
    return this;
  }
}

export class ReleasableMap<K, V extends IReleasable = IReleasable>
  implements IReleasable
{
  private readonly store = new Map<K, V>();

  release() {
    if (this.store.size) {
      try {
        release(this.store.values());
      } finally {
        this.store.clear();
      }
    }
  }

  releaseOne(key: K) {
    this.store.get(key)?.release();
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

  set(key: K, value: V) {
    this.store.set(key, value);
  }
}
