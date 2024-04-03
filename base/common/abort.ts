import { TimeoutTimer } from '@base/common/async';
import { NOOP } from '@base/common/constants';
import { Dispatcher } from '@base/common/event/dispatcher';
import { IReleasable } from '@base/common/lifecycle/releasable';

export interface IAbortToken {
  didAbort: boolean;

  readonly onAborted: (
    listener: (e: any) => any,
    thisTarget?: any,
    releasable?: IReleasable[],
  ) => IReleasable;
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
        release() {
          timer.release();
          timer = null!;
        },
      };
    },
  });

  export const get = () => {
    return new MutableAbortToken();
  };
}

class MutableAbortToken implements IAbortToken, IReleasable {
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

  release() {
    this._onAborted?.release();
    this._onAborted = null!;
  }
}
