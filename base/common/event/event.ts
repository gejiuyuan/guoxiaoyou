import { Emitter } from '@base/common/event/emitter';
import { Releasable, IReleasable } from '@base/common/lifecycle/releasable';
import {
  BaseObservable,
  IObservable,
  ObservableTransaction,
} from '@base/common/observable/observable';
import { IObserver } from '@base/common/observable/observer';

export interface MetaEvent<EventData, EventUtil = undefined> {
  (cb: (ev: EventData, evUtil?: EventUtil) => any): IReleasable;
}

export namespace MetaEvent {
  export const None: MetaEvent<any> = () => {
    return Releasable.None;
  };

  export function once<T>(event: MetaEvent<T>): MetaEvent<T> {
    return (listener) => {
      // 需要didFire标记，防止在listener执行期间又触发了这个事件
      let didFire = false;
      let result: IReleasable | undefined = undefined;
      result = event((e) => {
        if (didFire) {
          return;
        } else if (result) {
          result.release();
        } else {
          didFire = true;
        }
        return listener(e);
      });
      if (didFire) {
        result.release();
      }
      return result;
    };
  }
}

export class EventObservable<T> extends BaseObservable<T> {
  private _value?: T;

  private _hasValue = false;

  private subscription: IReleasable | null = null;

  constructor(
    private readonly event: MetaEvent<T>,
    private readonly getValue: (arg?: T) => T,
  ) {
    super();
  }

  get(): T {
    if (this.subscription) {
      if (!this._hasValue) {
        this._handler();
      }
      return this._value!;
    }
    return this.getValue();
  }

  private _handler() {
    const newValue = this.getValue();

    const _didChange = !this._hasValue || this._value !== newValue;

    if (_didChange) {
      this._value = newValue;
      if (this._hasValue) {
        ObservableTransaction.do((transaction) => {
          for (const observer of this.observers) {
            transaction.update(observer, this);
            observer.handleChange(this);
          }
        });
      }
      this._hasValue = true;
    }
  }

  protected onFirstObserverAdd(): void {
    this.subscription = this.event(this._handler);
  }

  protected onLastObserverDelete(): void {
    this.subscription?.release();
    this.subscription = null;
    this._value = void 0;
    this._hasValue = false;
  }
}

export class EventObserver<T> implements IObserver {
  private _count = 0;

  private _didChange = false;

  readonly dispatcher = new Emitter<T>({
    onBeforeAdd: (dispatcher) => {
      if (dispatcher.size === 0) {
        this._observable.add(this);
      }
    },
    onRemove: (dispatcher) => {
      if (dispatcher.size === 0) {
        this._observable.delete(this);
      }
    },
  });

  get event() {
    return this.dispatcher.on;
  }

  constructor(private readonly _observable: IObservable<T>) {}

  beginUpdate(): void {
    this._count++;
  }

  endUpdate(): void {
    if (--this._count === 0) {
      this._observable.reportChanges();
      if (this._didChange) {
        this._didChange = false;
        this.dispatcher.emit(this._observable.get());
      }
    }
  }

  handleChange(): void {
    this._didChange = true;
  }

  handlePossibleChange(): void {}
}
