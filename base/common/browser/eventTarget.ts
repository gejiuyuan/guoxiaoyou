import { IDisposable } from '@base/common/lifecycle/lifecycle';

export class TargetListener implements IDisposable {
  static create(...args: ConstructorParameters<typeof TargetListener>) {
    return new TargetListener(...args);
  }

  constructor(
    private _target: EventTarget,
    private readonly _type: EventType,
    private _callback: (ev: any) => void,
    private readonly _options: boolean | AddEventListenerOptions = false,
  ) {
    this._target.addEventListener(this._type, this._callback, this._options);
  }

  dispose() {
    if (!this._target) {
      return;
    }
    this._target.removeEventListener(this._type, this._callback, this._options);
    this._target = null!;
    this._callback = null!;
  }
}

export const enum EventType {
  // Mouse
  CLICK = 'click',
  AUX_CLICK = 'auxclick',
  DBL_CLICK = 'dblclick',
  MOUSE_UP = 'mouseup',
  MOUSE_DOWN = 'mousedown',
  MOUSE_MOVE = 'mousemove',
  MOUSE_OVER = 'mouseover',
  MOUSE_OUT = 'mouseout',
  MOUSE_ENTER = 'mouseenter',
  MOUSE_LEAVE = 'mouseleave',
  MOUSE_WHEEL = 'wheel',
  POINTER_DOWN = 'pointerdown',
  POINTER_MOVE = 'pointermove',
  POINTER_LEAVE = 'pointerleave',
  POINTER_UP = 'pointerup',
  CONTEXT_MENU = 'contextmenu',

  // Keyboard
  KEY_DOWN = 'keydown',
  KEY_PRESS = 'keypress',
  KEY_UP = 'keyup',

  // HTML Document

  RESIZE = 'resize',
}
