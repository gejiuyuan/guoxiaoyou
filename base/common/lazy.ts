export class Lazy<T> {
  private _didRun = false;

  private _value?: T;
  private _error?: Error;

  constructor(private readonly _executor: () => T) {}

  get hasValue() {
    return this._didRun;
  }

  get value() {
    if (!this._didRun) {
      try {
        this._value = this._executor();
      } catch (err) {
        this._error = err as typeof this._error;
      } finally {
        this._didRun = true;
      }
    }
    if (this._error) {
      throw this._error;
    }
    return this._value;
  }

  get rawValue(): T | undefined {
    return this._value;
  }
}
