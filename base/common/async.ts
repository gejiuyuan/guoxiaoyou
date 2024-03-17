import { IDisposable } from '@base/common/lifecycle/lifecycle';

export class TimeoutTimer implements IDisposable {
  private _mark: any = -1;

  constructor();
  constructor(cb: () => void, time: number);
  constructor(cb?: () => void, time?: number) {
    if (typeof cb === 'function' && typeof time === 'number') {
      this.set(cb, time);
    }
  }

  set(...args: Parameters<typeof this._set>) {
    if (~this._mark) {
      // did set
      return;
    }
    this._set(...args);
  }

  private _set(cb: () => void, time: number) {
    this._mark = setTimeout(() => {
      this._mark = -1;
      cb();
    }, time);
  }

  cancel() {
    if (~this._mark) {
      clearTimeout(this._mark);
      this._mark = -1;
    }
  }

  dispose() {
    this.cancel();
  }

  reset(...args: Parameters<typeof this._set>) {
    this.cancel();
    this.set(...args);
  }
}

export class IntervalTimer implements IDisposable {
  private _mark: any = -1;

  dispose() {
    this.cancel();
  }

  cancel() {
    if (~this._mark) {
      clearInterval(this._mark);
      this._mark = -1;
    }
  }

  reset(cb: () => void, time: number) {
    this.cancel();
    this._mark = setInterval(() => cb(), time);
  }
}
