import { NOOP } from '@base/common/constants';
import { IObserver } from '@base/common/observable/observer';

export interface IObservable<T> {
  /**
   * 返回当前结果，如果变化了，可通知IObservable.handleChange执行
   */
  get(): T;

  /**
   * 强制observable检查和报告变化
   */
  reportChanges(): void;

  /**
   * 添加指定的订阅对象
   * @param observer
   */
  add(observer: IObserver): void;

  /**
   * 删除指定的订阅对象
   * @param observer
   */
  delete(observer: IObserver): void;

  /**
   * 读取当前记过，并订阅这个可观察对象
   * @param reader
   */
  read(reader?: IObservableReader): T;

  /**
   * 创建依赖于此可观察对象的派生可观察对象
   * @param fn
   */
  map<TNew>(fn: (value: T, reader: IObservableReader) => TNew): IObservable<TNew>;
}

export interface IObservableReader {
  /**
   * 读取一个可观察对象的值并订阅它
   */
  read<T>(observable: IObservable<T>): T;
}

export abstract class AbstractObservable<T> implements IObservable<T> {
  read(reader?: IObservableReader | undefined): T {
    if (reader) {
      reader.read(this);
    }
    return this.get();
  }

  reportChanges(): void {
    this.get();
  }

  map<TNew>(): IObservable<TNew> {
    return null!;
  }

  abstract get(): T;
  abstract add(observer: IObserver): void;
  abstract delete(observer: IObserver): void;
}

export abstract class BaseObservable<T> extends AbstractObservable<T> {
  protected readonly observers = new Set<IObserver>();

  add(observer: IObserver): void {
    const { size } = this.observers;

    this.observers.add(observer);
    if (size === 0) {
      this.onFirstObserverAdd();
    }
  }

  delete(observer: IObserver): void {
    const isDeleted = this.observers.delete(observer);
    if (isDeleted && this.observers.size === 0) {
      this.onLastObserverDelete();
    }
  }

  protected onFirstObserverAdd() {}
  protected onLastObserverDelete() {}
}

export interface ISettable<T> {
  set(value: T, transaction?: IObservableTransaction): void;
}

export interface ISettableObservable<T> extends IObservable<T>, ISettable<T> {}

export class ObservableValue<T>
  extends BaseObservable<T>
  implements ISettableObservable<T>
{
  protected _value: T;

  constructor(value: T) {
    super();
    this._value = value;
  }

  get(): T {
    return this._value;
  }

  set(value: T, transaction?: IObservableTransaction): void {
    if (this._value === value) {
      return;
    }
    let _transaction: ObservableTransaction | null = null;
    if (!transaction) {
      transaction = _transaction = new ObservableTransaction(NOOP);
    }

    try {
      this._value = value;
      for (const observer of this.observers) {
        transaction.update(observer, this);
        observer.handleChange(this);
      }
    } finally {
      if (_transaction) {
        _transaction.finish();
      }
    }
  }
}

export interface IObservableTransaction {
  update(observer: IObserver, observable: IObservable<any>): void;
}

export class ObservableTransaction implements IObservableTransaction {
  private readonly _updatings = new Array<{
    observer: IObserver;
    observable: IObservable<any>;
  }>();

  constructor(
    private readonly func: (observerTransaction: ObservableTransaction) => void,
  ) {}

  update(observer: IObserver, observable: IObservable<any>): void {
    this._updatings.push({ observable, observer });
    observer.beginUpdate(observable);
  }

  finish() {
    const _updatings = [...this._updatings];
    this._updatings.length = 0;
    for (const { observable, observer } of _updatings) {
      observer.endUpdate(observable);
    }
  }

  do() {
    try {
      this.func(this);
    } finally {
      this.finish();
    }
  }

  static do(...args: ConstructorParameters<typeof ObservableTransaction>) {
    new ObservableTransaction(...args).do();
  }
}
