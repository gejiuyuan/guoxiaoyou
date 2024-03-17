import { Dispatcher } from '@base/common/event/dispatcher';
import { Disposable } from '@base/common/lifecycle/lifecycle';

export class ResizeObserverDisposable extends Disposable {
  #targets = new Set<Element>();

  #observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    this.#onChange.dispatch(entries);
  });

  #onChange = this.addDisposale(new Dispatcher<ResizeObserverEntry[]>());
  public get onChange() {
    return this.#onChange.event;
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    if (this.#observer && !this.#targets.has(target)) {
      this.#targets.add(target);
      this.#observer.observe(target, options);
    }
  }

  unobserve(target?: Element) {
    if (this.#observer) {
      let _targets = target ? [target] : this.#targets;
      _targets.forEach((tar) => {
        if (this.#targets.has(tar)) {
          this.#targets.delete(tar);
          this.#observer.unobserve(tar);
        }
      });
      _targets = null!;
    }
  }

  disconnect() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null!;
      this.#targets.clear();
    }
  }

  clear(): void {
    super.clear();
    this.unobserve();
  }

  dispose(): void {
    super.dispose();
    this.disconnect();
  }
}
