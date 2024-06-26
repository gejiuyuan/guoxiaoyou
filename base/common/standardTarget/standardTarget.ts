import { EventType, TargetListener } from '@base/common/browser/eventTarget';
import { Releasable } from '@base/common/lifecycle/releasable';

export class StandardTarget<T extends EventTarget> extends Releasable {
  constructor(public target: T) {
    super();
  }

  release(): void {
    super.release();
    this.target = null!;
  }

  click(cb: (ev: GlobalEventHandlersEventMap['click']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.CLICK, (ev) => {
        cb(ev);
      }),
    );
  }

  dblclick(cb: (ev: GlobalEventHandlersEventMap['dblclick']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.DBL_CLICK, (ev) => {
        cb(ev);
      }),
    );
  }

  mousedown(cb: (ev: GlobalEventHandlersEventMap['mousedown']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_DOWN, (ev) => {
        cb(ev);
      }),
    );
  }

  mousemove(cb: (ev: GlobalEventHandlersEventMap['mousemove']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_MOVE, (ev) => {
        cb(ev);
      }),
    );
  }

  mouseup(cb: (ev: GlobalEventHandlersEventMap['mouseup']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_UP, (ev) => {
        cb(ev);
      }),
    );
  }

  mouseover(cb: (ev: GlobalEventHandlersEventMap['mouseover']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_OVER, (ev) => {
        cb(ev);
      }),
    );
  }

  mouseout(cb: (ev: GlobalEventHandlersEventMap['mouseout']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_OUT, (ev) => {
        cb(ev);
      }),
    );
  }

  pointerdown(cb: (ev: GlobalEventHandlersEventMap['pointerdown']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.POINTER_DOWN, (ev) => {
        cb(ev);
      }),
    );
  }

  pointermove(cb: (ev: GlobalEventHandlersEventMap['pointermove']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.POINTER_MOVE, (ev) => {
        cb(ev);
      }),
    );
  }

  pointerup(cb: (ev: GlobalEventHandlersEventMap['pointerup']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.POINTER_UP, (ev) => {
        cb(ev);
      }),
    );
  }

  wheel(cb: (ev: GlobalEventHandlersEventMap['wheel']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.MOUSE_WHEEL, (ev) => {
        cb(ev);
      }),
    );
  }

  contextmenu(cb: (ev: GlobalEventHandlersEventMap['contextmenu']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.CONTEXT_MENU, (ev) => {
        cb(ev);
      }),
    );
  }

  keydown(cb: (ev: GlobalEventHandlersEventMap['keydown']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.KEY_DOWN, (ev) => {
        cb(ev);
      }),
    );
  }

  keyup(cb: (ev: GlobalEventHandlersEventMap['keyup']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.KEY_UP, (ev) => {
        cb(ev);
      }),
    );
  }

  resize(cb: (ev: GlobalEventHandlersEventMap['resize']) => void) {
    this.collect(
      TargetListener.create(this.target, EventType.RESIZE, (ev) => {
        cb(ev);
      }),
    );
  }
}
