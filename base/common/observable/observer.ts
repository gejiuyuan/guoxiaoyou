import { IObservable } from '@base/common/observable/observable';

/**
 * Observable的订阅者
 *
 * 如果观察者订阅了一个可观察量，并且该可观察量没有通过观察者的任一方法发出变化信号，那么观察者
 * 可以假设该可变化量没有变化。如果一个可观察量报告了可能的变化，则强制该可观察量报告一个实际的变化
 * @export
 * @interface IObserver
 */
export interface IObserver {
  /**
   * 表示给定的可观察量值可能已经变化，并且可能会启动修改该可观察量值的事务。
   * 在给定的可观察量可以再次调用此方法之前，必须调用
   *
   * IObservable.reportChanges方法可用来强制observable报告变化
   *
   * @template T
   * @param {IObservable<T>} observable
   * @memberof IObserver
   */
  beginUpdate<T>(observable: IObservable<T>): void;

  /**
   * 表示可能修改给定可观察量值的交易已结束
   *
   * @template T
   * @param {IObservable<T>} observable
   * @memberof IObserver
   */
  endUpdate<T>(observable: IObservable<T>): void;

  /**
   * 表示给定的可观察量可能已经变化。此方法可用于强制观察者报告变化
   *
   * 实现工具不能调用其它可观察量，因为它们可能尚未接收到此事件！更改应该延迟处理或者在IObserver.endUpdate中
   *
   * @template T
   * @param {IObservable<T>} observable
   * @memberof IObserver
   */
  handlePossibleChange<T>(observable: IObservable<T>): void;

  /**
   * 表示给定的可观察量变化
   *
   * 实现工具不能调用其它可观察量，因为它们可能尚未接收到此事件！更改应该延迟处理或者在IObserver.endUpdate中
   *
   * @template T
   * @param {IObservable<T>} observable
   * @memberof IObserver
   */
  handleChange<T>(observable: IObservable<T>): void;
}
