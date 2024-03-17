import { TimeoutTimer } from '@base/common/async';
import { NOOP } from '@base/common/constants';
import { Dispatcher } from '@base/common/event/dispatcher';
import { IDisposable } from '@base/common/lifecycle/lifecycle';

export interface IAbortToken {
  didAbort: boolean;

  readonly onAborted: (
    listener: (e: any) => any,
    thisTarget?: any,
    disposables?: IDisposable[],
  ) => IDisposable;
}

export namespace AbortToken {
  export const None = Object.freeze<IAbortToken>({
    didAbort: false,
    onAborted: NOOP,
  });

  export const Completed = Object.freeze<IAbortToken>({
    didAbort: true,
    onAborted: function (listener, thisTarget?) {
      let timer = new TimeoutTimer(() => {
        listener.call(thisTarget, void 0);
      }, 0);
      return {
        dispose() {
          timer.dispose();
          timer = null!;
        },
      };
    },
  });

  export const get = () => {
    return new MutableAbortToken();
  };
}

class MutableAbortToken implements IAbortToken, IDisposable {
  didAbort: boolean = false;
  private _onAborted: Dispatcher<any> | null = null;

  get onAborted() {
    if (this.didAbort) {
      return AbortToken.None.onAborted;
    }

    if (!this._onAborted) {
      this._onAborted = new Dispatcher();
    }

    return this._onAborted.event;
  }

  abort() {
    this.didAbort = true;
  }

  dispose() {
    this._onAborted?.dispose();
    this._onAborted = null!;
  }
}
