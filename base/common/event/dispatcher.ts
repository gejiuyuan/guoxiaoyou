import { AbortToken, IAbortToken } from '@base/common/abort';
import { NOOP, RETURN_FALSE } from '@base/common/constants';
import { MetaEvent } from '@base/common/event/event';
import { isUndef } from '@base/common/functional';
import { isPromise } from '@base/common/is';
import {
  Disposable,
  DisposableStore,
  IDisposable,
  toDisposable,
} from '@base/common/lifecycle/lifecycle';
import { DoublyLinkedList } from '@base/common/structure/doubleLinkedList';

export interface DispatcherParams<T, D = undefined> {
  onBeforeAdd?: (dispatcher: InstanceType<typeof BaseDispatcher<T, D>>) => any;
  onAdd?: (dispatcher: InstanceType<typeof BaseDispatcher<T, D>>) => any;
  onBeforeRemove?: (dispatcher: InstanceType<typeof BaseDispatcher<T, D>>) => any;
  onRemove?: (dispatcher: InstanceType<typeof BaseDispatcher<T, D>>) => any;
  onError?: (dispatcher: InstanceType<typeof BaseDispatcher<T, D>>, error: Error) => any;
}

export abstract class BaseDispatcher<T, D = undefined> implements IDisposable {
  constructor(protected readonly _params?: DispatcherParams<T, D>) {}

  protected _listeners: Array<Parameters<MetaEvent<T, D>>[0] | undefined> = [];

  protected _size = 0;

  get size() {
    return this._size;
  }

  dispose() {
    if (this._listeners.length) {
      this._listeners.length = 0;
      this._size = 0;
      this._params?.onRemove?.(this);
    }
  }

  private remove(listener: (typeof this._listeners)[number]) {
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

  abstract dispatch(eventData: T): void;

  protected _event?: MetaEvent<T, D>;
  get event() {
    if (!this._event) {
      this._event = (...[cb, thisTarget, disposables]: Parameters<MetaEvent<T, D>>) => {
        if (thisTarget) {
          cb = cb.bind(thisTarget);
        }

        this._params?.onBeforeAdd?.(this);
        this._listeners.push(cb);
        this._size++;
        this._params?.onAdd?.(this);

        const _event = toDisposable(() => {
          this.remove(cb);
        });

        if (disposables instanceof DisposableStore) {
          disposables.add(_event);
        } else if (Array.isArray(disposables)) {
          disposables.push(_event);
        }

        return _event;
      };
    }
    return this._event!;
  }

  protected _onceEvent?: (...args: Parameters<typeof this.event>) => void;
  get onceEvent() {
    if (!this._onceEvent) {
      this._onceEvent = (...[cb, ...rest]: Parameters<typeof this.event>) => {
        const disposable = this.event(
          function (...args) {
            let res: any;
            if (res[0]) {
              res = cb.call(rest[0], ...args);
            } else {
              res = cb(...args);
            }
            disposable.dispose();
            return res;
          },
          ...rest,
        );
      };
    }
    return this._onceEvent!;
  }

  protected dispatchLoop(
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
          this.dispatchLoop(index, length, cb, interruptFn);
        });
      }
      if (interruptFn()) {
        return res;
      }
    }
  }
}

export class Dispatcher<T> extends BaseDispatcher<T> {
  dispatch(eventData: T) {
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
    return this.dispatchLoop(i, length, fn);
  }
}

export interface IInterruptEventData {
  interrupt(): any;
}

/**
 * 可中断的dispatcher
 * @export
 * @class InterruptableDispatcher
 * @extends {BaseDispatcher<T, IInterruptEventData['interrupt']>}
 * @template T
 */
export class InterruptableDispatcher<T> extends BaseDispatcher<
  T,
  IInterruptEventData['interrupt']
> {
  dispatch(eventData: T): void {
    if (!this.size) {
      return;
    }
    let isInterrupted = false;
    const interrupt = () => {
      isInterrupted = true;
    };
    const onError = this._params?.onError;
    const fn = !onError
      ? (cb: (typeof this._listeners)[number]) => {
          return cb!(eventData, interrupt);
        }
      : (cb: (typeof this._listeners)[number]) => {
          const onReturn = (res: unknown) => {
            if (res === false && !isInterrupted) {
              interrupt();
            }
            return res;
          };
          const onCatch = (err: Error) => {
            interrupt();
            onError!(this, err);
            return false;
          };
          try {
            const res = cb!(eventData, interrupt);
            if (isPromise(res)) {
              return res.then(onReturn).catch(onCatch);
            }
            return onReturn(res);
          } catch (err) {
            return onCatch(new Error(err as unknown as string));
          }
        };

    let i = 0;
    const { length } = this._listeners;
    return this.dispatchLoop(i, length, fn, () => isInterrupted);
  }
}

export interface IWaitUntil {
  abortToken: IAbortToken;
  waitUntil(promise: Promise<unknown>): void;
}

export class AsyncDispatcher<T> extends BaseDispatcher<T, IWaitUntil> {
  private _taskQueue?: DoublyLinkedList<[(typeof this._listeners)[number], T]>;

  async dispatch(eventData: T, abortToken: IAbortToken = AbortToken.None) {
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

export class PauseableDispatcher<T> extends Dispatcher<T> {
  private _pausedCount = 0;

  protected _eventQueue = new DoublyLinkedList<T>();

  private _merge?: (infos: T[]) => T;

  get isPaused() {
    return this._pausedCount !== 0;
  }

  constructor(params?: DispatcherParams<T> & { merge?: (infos: T[]) => T }) {
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
          super.dispatch(this._merge(events));
        }
      } else {
        while (!this._pausedCount && this._eventQueue.size) {
          super.dispatch(this._eventQueue.shift()!);
        }
      }
    }
  }

  dispatch(eventData: T): void {
    if (this.size) {
      if (this.isPaused) {
        this._eventQueue.push(eventData);
      } else {
        super.dispatch(eventData);
      }
    }
  }
}

export class DebounceDispatcher<T> extends PauseableDispatcher<T> {
  private readonly _time: number;

  private _handler: any | undefined;

  constructor(params: DispatcherParams<T> & { merge: (infos: T[]) => T; time?: number }) {
    super(params);
    this._time = isUndef(params.time) ? 100 : params.time;
  }

  dispatch(eventData: T): void {
    if (!this._handler) {
      this.pause();
      this._handler = setTimeout(() => {
        this._handler = void 0;
        this.resume();
      }, this._time);
    }
    super.dispatch(eventData);
  }
}

export class MicrotaskDispatcher<T> extends Dispatcher<T> {
  private readonly _queuedEvents = new Array<T>();

  private _merge?: (infos: T[]) => T;

  constructor(params?: DispatcherParams<T> & { merge?: (infos: T[]) => T }) {
    super(params);
    this._merge = params?.merge;
  }

  dispatch(eventData: T): void {
    if (!this.size) {
      return;
    }
    this._queuedEvents.push(eventData);
    if (this._queuedEvents.length === 1) {
      queueMicrotask(() => {
        if (this._merge) {
          super.dispatch(this._merge(this._queuedEvents));
        } else {
          this._queuedEvents.forEach((event) => super.dispatch(event));
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
    return (listener, thisArgs?, disposables?) => {
      return event(
        (eventData) => {
          const buffer = this._buffers.at(-1);
          if (buffer) {
            buffer.push(() => {
              listener.call(thisArgs, eventData, void 0);
            });
          } else {
            listener.call(thisArgs, eventData, void 0);
          }
        },
        void 0,
        disposables,
      );
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

// eg:
// const dispatcher = new Dispatcher();
// const bufferer = new EventBuffer();
// const bufferEvent = bufferer.wrap(v.event);
// bufferEvent((ev) => {
// 	console.log(ev);
// });
// bufferer.buffer(() => {
// 	dispatcher.dispatch(9);
// });

/**
 * 中继转发器
 * @description
 *  中继是一个事件转发器，充当可重新插入的事件管道。创建后，可以将输入事件连接到它，它将简单地通过自己的event来转发
 *  来自该输入事件的事件。输入（input）可随时更改
 * @export
 * @class Relay
 * @implements {IDisposable}
 * @template T
 */
export class Relay<T> implements IDisposable {
  private _inputEvent: MetaEvent<T> = MetaEvent.None;

  private _inputEventListener: IDisposable = Disposable.None;

  private readonly dispatcher = new Dispatcher<T>({
    onBeforeAdd: (dispatcher) => {
      if (dispatcher.size === 0) {
        this._inputEventListener = this._inputEvent(dispatcher.dispatch, dispatcher);
      }
    },
    onRemove: (dispatcher) => {
      if (dispatcher.size === 0) {
        this._inputEventListener.dispose();
      }
    },
  });

  public readonly event: MetaEvent<T> = this.dispatcher.event;

  set input(event: MetaEvent<T>) {
    this._inputEvent = event;

    if (this.dispatcher.size) {
      this._inputEventListener.dispose();
      this._inputEventListener = this._inputEvent(
        this.dispatcher.dispatch,
        this.dispatcher,
      );
    }
  }

  dispose() {
    this._inputEventListener.dispose();
    this.dispatcher.dispose();
  }
}

export class EventMultiplexer<T> implements IDisposable {
  private _events = new Array<{
    event: MetaEvent<T>;
    listener: IDisposable | null;
  }>();

  get event() {
    return this.dispatcher.event;
  }

  get hasListener() {
    return !this.dispatcher.size;
  }

  private readonly dispatcher = new Dispatcher<T>({
    onBeforeAdd: (dispatcher) => {
      if (dispatcher.size === 0) {
        this._events.forEach((ev) => this._hook(ev));
      }
    },
    onRemove: (dispatcher) => {
      if (dispatcher.size === 0) {
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

    return toDisposable(() => {
      if (this.hasListener) {
        this._unhook(e);
        this._events.splice(this._events.indexOf(e), 1);
      }
    });
  }

  private _hook(e: (typeof this._events)[number]) {
    e.listener = e.event((eventData) => {
      this.dispatcher.dispatch(eventData);
    });
  }

  private _unhook(e: (typeof this._events)[number]) {
    if (e.listener) {
      e.listener.dispose();
      e.listener = null;
    }
  }

  dispose() {
    this.dispatcher.dispose();
  }
}
