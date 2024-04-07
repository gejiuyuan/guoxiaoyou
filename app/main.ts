import '@app/css/index.css';
import { createReactivity } from '@base/common/reactivity/reactivity';
import { CanvasKitApp } from '@base/canvas-kit/canvas-kit';

// const app = new Application({});

// await app.init({
//   background: 'cornflowerblue',
//   resizeTo: window,
// });

// let obj = new Graphics().rect(500, 200, 400, 300).fill(0xff0000);

// // Add it to the stage to render
// app.stage.addChild(obj);

// document.getElementById('canvas')!.append(app.canvas);

const canvasKitApp = new CanvasKitApp();
canvasKitApp.init();

const { reactive, watch } = createReactivity();

class A {
  @reactive accessor a = 1;
  @reactive accessor b = 1;
  _c: string = '1';
  @reactive
  get c() {
    return this._c;
  }

  set c(v) {
    this._c = v;
  }
}

const a = new A();

watch(
  a,
  (newValue, oldValue) => {
    // eslint-disable-next-line no-console
    console.log(newValue.a, '---', oldValue?.a);
  },
  { immediate: true, once: true, flush: 'sync' },
);

watch(
  () => a.b,
  (newValue, oldValue) => {
    // eslint-disable-next-line no-console
    console.log(newValue, '---', oldValue);
  },
);

const stopWatch = watch(
  () => [a.b, a.c] as const,
  (newValue, oldValue) => {
    // eslint-disable-next-line no-console
    console.log(newValue, '---', oldValue);
  },
);

document.addEventListener('click', () => stopWatch());
