import { isBrowser } from '@base/common/browser/browserInfo';
import { Releasable } from '@base/common/lifecycle/releasable';
import CanvasKitInit, { CanvasKit, Surface } from 'canvaskit-wasm/profiling';

export interface ICanvaskitOptions {
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
  devicePixelRatio?: number;
}

export class CanvasKitApp extends Releasable {
  constructor() {
    super();
  }

  #CanvasKit!: CanvasKit;
  get CanvasKit() {
    return this.#CanvasKit;
  }

  #surface!: Surface;
  get surface() {
    return this.#surface;
  }

  #canvas!: HTMLCanvasElement;
  get canvas() {
    return this.#canvas;
  }

  #context!: CanvasRenderingContext2D;
  get context() {
    return this.#context;
  }

  #dpr!: number;
  get dpr() {
    return this.#dpr;
  }

  init(options: ICanvaskitOptions = Object()) {
    this.#canvas = options.canvas || document.createElement('canvas');
    CanvasKitInit({
      locateFile: (file: string) => {
        return '/node_modules/canvaskit-wasm/bin/profiling/' + file;
      },
    }).then((CanvasKit) => {
      this.#CanvasKit = CanvasKit;
      const surface = CanvasKit.MakeWebGLCanvasSurface(this.#canvas);
      if (!surface) {
        throw new Error('failed to create a surface');
      }
      this.#surface = surface;
      const dpr = options.devicePixelRatio || (isBrowser ? window.devicePixelRatio : 1);
      this.#dpr = Math.max(Math.ceil(dpr), 1);
      this.resize(options.width, options.height);
    });
  }

  private resize(width: number, height: number) {
    if (this.#canvas) {
      this.#canvas.width = this.dpr * width;
      this.#canvas.height = this.dpr * height;
    }
  }

  release(): void {
    super.release();
    this.#surface!.dispose();
    this.#CanvasKit = null!;
    this.#canvas = null!;
  }
}
