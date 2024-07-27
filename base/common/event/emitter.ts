import { AbortToken, IAbortToken } from '@base/common/abort';
import { NOOP, RETURN_FALSE } from '@base/common/constants';
import { MetaEvent } from '@base/common/event/event';
import { isUndef } from '@base/common/functional';
import { isPromise } from '@base/common/is';
import { Releasable, IReleasable, toReleasable } from '@base/common/lifecycle/releasable';
import { DoublyLinkedList } from '@base/common/structure/doubleLinkedList';

export interface EmitterParams<T, D = undefined> {
  onBeforeAdd?: (emitter: InstanceType<typeof Emitter<T, D>>) => any;
  onAdd?: (emitter: InstanceType<typeof Emitter<T, D>>) => any;
  onBeforeRemove?: (emitter: InstanceType<typeof Emitter<T, D>>) => any;
  onRemove?: (emitter: InstanceType<typeof Emitter<T, D>>) => any;
  onError?: (emitter: InstanceType<typeof Emitter<T, D>>, error: Error) => any;
}

export class Emitter<T, D = undefined> implements IReleasable {
  constructor(protected readonly _params?: EmitterParams<T, D>) {}

  protected _listeners: Array<Parameters<MetaEvent<T, D>>[0] | undefined> = [];

  protected _size = 0;

  get size() {
    return this._size;
  }

  release() {
    if (this._listeners.length) {
      this._listeners.length = 0;
      this._size = 0;
      this._params?.onRemove?.(this);
    }
  }

  off(listener: (typeof this._listeners)[number]) {
    if (!this._size) {
      return;
    }

    const index = this._listeners.indexOf(listener);
    if (~index) {
      this._params?.onBeforeRemove?.(this);
      this._listeners[index] = void 0;
      this._size--;
      this._params?.onRemove?.(this);
      return;
    }
    throw new Error(`no this listener`);
  }

  declare protected _on?: MetaEvent<T, D>;
  get on() {
    if (!this._on) {
      this._on = (...[cb]: Parameters<MetaEvent<T, D>>) => {
        this._params?.onBeforeAdd?.(this);
        this._listeners.push(cb);
        this._size++;
        this._params?.onAdd?.(this);
        return toReleasable(() => {
          this.off(cb);
        });
      };
    }
    return this._on;
  }

  get once() {
    return (...[cb]: Parameters<typeof this.on>) => {
      const releasable = this.on(function (...args) {
        const res = cb(...args);
        releasable.release();
        return res;
      });
    };
  }

  emit(eventData: T) {
    if (!this.size) {
      return;
    }
    const onError = this._params?.onError;
    const fn = !onError
      ? (cb: (typeof this._listeners)[number]) => {
          return cb!(eventData, void 0);
        }
      : (cb: (typeof this._listeners)[number]) => {
          try {
            return cb!(eventData, void 0);
          } catch (err) {
            onError!(this, new Error(err as any));
          }
        };

    let i = 0;
    const { length } = this._listeners;
    return this.emitLoop(i, length, fn);
  }

  protected emitLoop(
    index: number,
    length: number,
    cb: (listener: (typeof this._listeners)[number]) => any,
    interruptFn: () => boolean = RETURN_FALSE,
  ): Promise<any> | any {
    while (index < length) {
      const res = cb(this._listeners[index++] || NOOP);
      if (isPromise(res)) {
        return res.then((value) => {
          if (interruptFn()) {
            return value;
          }
          this.emitLoop(index, length, cb, interruptFn);
        });
      }
      if (interruptFn()) {
        return res;
      }
    }
  }
}

export interface IWaitUntil {
  abortToken: IAbortToken;
  waitUntil(promise: Promise<unknown>): void;
}

export class AsyncEmitter<T> extends Emitter<T, IWaitUntil> {
  private _taskQueue?: DoublyLinkedList<[(typeof this._listeners)[number], T]>;

  async emit(eventData: T, abortToken: IAbortToken = AbortToken.None) {
    if (!this.size) {
      return;
    }

    if (!this._taskQueue) {
      this._taskQueue = new DoublyLinkedList();
    }

    this._listeners.forEach((listener) => {
      if (listener) {
        this._taskQueue!.push([listener, eventData]);
      }
    });

    let promises = new Array<Promise<unknown>>();
    while (this._taskQueue.size && !abortToken.didAbort) {
      promises.length = 0;
      const [listener, eventData] = this._taskQueue.shift()!;
      try {
        listener!(eventData, {
          abortToken,
          waitUntil(promise: Promise<unknown>) {
            promises.push(promise);
          },
        });
      } catch (err) {
        continue;
      }
      await Promise.allSettled(promises);
    }
    promises = null!;
  }
}

export class PauseableEmitter<T> extends Emitter<T> {
  private _pausedCount = 0;

  protected _eventQueue = new DoublyLinkedList<T>();

  private _merge?: (infos: T[]) => T;

  get isPaused() {
    return this._pausedCount !== 0;
  }

  constructor(params?: EmitterParams<T> & { merge?: (infos: T[]) => T }) {
    super(params);
    this._merge = params?.merge;
  }

  pause() {
    this._pausedCount++;
  }

  resume() {
    if (this.isPaused && --this._pausedCount === 0) {
      if (this._merge) {
        if (this._eventQueue.size) {
          const events = [...this._eventQueue];
          this._eventQueue.clear();
          super.emit(this._merge(events));
        }
      } else {
        while (!this._pausedCount && this._eventQueue.size) {
          super.emit(this._eventQueue.shift()!);
        }
      }
    }
  }

  emit(eventData: T): void {
    if (this.size) {
      if (this.isPaused) {
        this._eventQueue.push(eventData);
      } else {
        super.emit(eventData);
      }
    }
  }
}

export class DebounceEmitter<T> extends PauseableEmitter<T> {
  private readonly _time: number;

  private _handler: any | undefined;

  constructor(params: EmitterParams<T> & { merge: (infos: T[]) => T; time?: number }) {
    super(params);
    this._time = isUndef(params.time) ? 100 : params.time;
  }

  emit(eventData: T): void {
    if (!this._handler) {
      this.pause();
      this._handler = setTimeout(() => {
        this._handler = void 0;
        this.resume();
      }, this._time);
    }
    super.emit(eventData);
  }
}

export class MicrotaskEmitter<T> extends Emitter<T> {
  private readonly _queuedEvents = new Array<T>();

  private _merge?: (infos: T[]) => T;

  constructor(params?: EmitterParams<T> & { merge?: (infos: T[]) => T }) {
    super(params);
    this._merge = params?.merge;
  }

  emit(eventData: T): void {
    if (!this.size) {
      return;
    }
    this._queuedEvents.push(eventData);
    if (this._queuedEvents.length === 1) {
      queueMicrotask(() => {
        if (this._merge) {
          super.emit(this._merge(this._queuedEvents));
        } else {
          this._queuedEvents.forEach((event) => super.emit(event));
        }
        this._queuedEvents.length = 0;
      });
    }
  }
}

/**
 * 事件缓冲器
 * @description
 *  在某些代码期间延迟触发事件，你可以包装此代码并确认事件在此期间被执行
 * @export
 * @class EventBuffer
 */
export class EventBuffer {
  private readonly _buffers = new Array<Function[]>();

  wrap<T extends Array<any>>(event: MetaEvent<T>): MetaEvent<T> {
    return (listener) => {
      return event((eventData) => {
        const buffer = this._buffers.at(-1);
        if (buffer) {
          buffer.push(() => {
            listener(eventData, void 0);
          });
        } else {
          listener(eventData, void 0);
        }
      });
    };
  }

  buffer<V = void>(cb: () => V): V {
    const buffer = new Array<typeof cb>();
    this._buffers.push(buffer);
    const value = cb();
    this._buffers.pop();
    buffer.forEach((flush) => flush());
    return value;
  }
}

/**
 * 中继转发器
 * @description
 *  中继是一个事件转发器，充当可重新插入的事件管道。创建后，可以将输入事件连接到它，它将简单地通过自己的event来转发
 *  来自该输入事件的事件。输入（input）可随时更改
 * @export
 * @class Relay
 * @template T
 */
export class Relay<T> implements IReleasable {
  private _inputEvent: MetaEvent<T> = MetaEvent.None;

  private _inputEventListener: IReleasable = Releasable.None;

  private readonly emitter = new Emitter<T>({
    onBeforeAdd: (emitter) => {
      if (emitter.size === 0) {
        this._inputEventListener = this._inputEvent((ev) => {
          return emitter.emit(ev);
        });
      }
    },
    onRemove: (emitter) => {
      if (emitter.size === 0) {
        this._inputEventListener.release();
      }
    },
  });

  public readonly event: MetaEvent<T> = this.emitter.on;

  set input(event: MetaEvent<T>) {
    this._inputEvent = event;

    if (this.emitter.size) {
      this._inputEventListener.release();
      this._inputEventListener = this._inputEvent((ev) => {
        return this.emitter.emit(ev);
      });
    }
  }

  release() {
    this._inputEventListener.release();
    this.emitter.release();
  }
}

export class EventMultiplexer<T> implements IReleasable {
  private _events = new Array<{
    event: MetaEvent<T>;
    listener: IReleasable | null;
  }>();

  get on() {
    return this.emitter.on;
  }

  get hasListener() {
    return !this.emitter.size;
  }

  private readonly emitter = new Emitter<T>({
    onBeforeAdd: (emitter) => {
      if (emitter.size === 0) {
        this._events.forEach((ev) => this._hook(ev));
      }
    },
    onRemove: (emitter) => {
      if (emitter.size === 0) {
        this._events.forEach((ev) => this._unhook(ev));
      }
    },
  });

  add(event: MetaEvent<T>) {
    const e: (typeof this._events)[number] = {
      event,
      listener: null,
    };

    if (this.hasListener) {
      this._hook(e);
    }

    return toReleasable(() => {
      if (this.hasListener) {
        this._unhook(e);
        this._events.splice(this._events.indexOf(e), 1);
      }
    });
  }

  private _hook(e: (typeof this._events)[number]) {
    e.listener = e.event((eventData) => {
      this.emitter.emit(eventData);
    });
  }

  private _unhook(e: (typeof this._events)[number]) {
    if (e.listener) {
      e.listener.release();
      e.listener = null;
    }
  }

  release() {
    this.emitter.release();
  }
}
