import { KeyCode } from '@base/common/browser/keyCodes';

export interface IBrowserEvent<T extends UIEvent> {
  preventDefault(): void;
  stopPropagation(): void;
  readonly timestamp: number;
  readonly originalEvent: T;
  readonly type: string;
  readonly target: EventTarget;
}

abstract class AbstractEvent<T extends UIEvent> implements IBrowserEvent<T> {
  readonly timestamp: number;
  readonly type: string;
  readonly target: EventTarget;

  constructor(readonly originalEvent: T) {
    this.timestamp = Date.now();
    this.type = originalEvent.type;
    this.target = originalEvent.target!;
  }

  stopPropagation(): void {
    this.originalEvent.stopPropagation();
  }

  preventDefault(): void {
    this.originalEvent.preventDefault();
  }
}

export interface IMouseEvent<T extends MouseEvent = MouseEvent> extends IBrowserEvent<T> {
  readonly isLeftButton: boolean;
  readonly isMiddleButton: boolean;
  readonly isRightButton: boolean;
  readonly buttons: number;
  readonly detail: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly mouseX: number;
  readonly mouseY: number;
}

export class BaseMouseEvent<T extends MouseEvent = MouseEvent>
  extends AbstractEvent<T>
  implements IMouseEvent<T>
{
  readonly isLeftButton: boolean;
  readonly isMiddleButton: boolean;
  readonly isRightButton: boolean;
  readonly buttons: number;
  readonly detail: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly mouseX: number;
  readonly mouseY: number;

  constructor(ev: T) {
    super(ev);
    this.buttons = ev.buttons;
    this.isLeftButton = ev.button === 0;
    this.isMiddleButton = ev.button === 1;
    this.isRightButton = ev.button === 2;
    this.detail = ev.type === 'dblclick' ? 2 : ev.detail || 1;
    this.ctrlKey = ev.ctrlKey;
    this.altKey = ev.altKey;
    this.metaKey = ev.metaKey;
    this.shiftKey = ev.shiftKey;
    this.mouseX = ev.clientX;
    this.mouseY = ev.clientY;
  }
}

export interface IMouseWheelEvent extends IMouseEvent<WheelEvent> {
  readonly wheelDeltaX: number;
  readonly wheelDeltaY: number;

  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;

  /**
   * 鼠标滚轮模式
   *
   *  值：
   *    0 像素级
   *    1 行级别
   *    2 页级别
   */
  readonly deltaMode: number;
}

export class BaseWheelEvent
  extends BaseMouseEvent<WheelEvent>
  implements IMouseWheelEvent
{
  readonly wheelDeltaX: number;
  readonly wheelDeltaY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly deltaMode: number;

  constructor(ev: WheelEvent) {
    super(ev);
    this.wheelDeltaX = (ev as any).wheelDeltaX;
    this.wheelDeltaY = (ev as any).wheelDeltaY;
    this.deltaX = ev.deltaX || this.wheelDeltaX / -3 || 0;
    this.deltaY = ev.deltaY || this.wheelDeltaY / -3 || 0;
    this.deltaZ = ev.deltaZ;
    this.deltaMode = ev.deltaMode;
  }
}

export interface IKeyboardEvent extends IBrowserEvent<KeyboardEvent> {
  readonly key: string;
  readonly code: string;
  readonly keyCode: KeyCode;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export class BaseKeyboardEvent
  extends AbstractEvent<KeyboardEvent>
  implements IKeyboardEvent
{
  readonly key: string;
  readonly code: string;
  readonly keyCode: KeyCode;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;

  constructor(ev: KeyboardEvent) {
    super(ev);
    this.key = ev.key;
    this.code = ev.code;
    this.keyCode = ev.keyCode;
    this.ctrlKey = ev.ctrlKey || ev.metaKey;
    this.metaKey = ev.metaKey;
    this.shiftKey = ev.shiftKey;
    this.altKey = ev.altKey;
  }
}
