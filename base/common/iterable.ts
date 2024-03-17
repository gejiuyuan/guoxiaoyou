export namespace Iterable {
  export function is<T = any>(thing: any): thing is Iterable<T> {
    return (
      thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function'
    );
  }

  const _empty: Iterable<any> = Object.freeze([]);

  export function empty<T = any>(): Iterable<T> {
    return _empty;
  }

  export function* single<T>(thing: T): Iterable<T> {
    yield thing;
  }

  export function isEmpty<T>(iterable: Iterable<T> | undefined | null) {
    return !iterable || iterable[Symbol.iterator]().next().done === true;
  }
}
