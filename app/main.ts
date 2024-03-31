import '@app/css/index.css';
import { Application, Graphics } from 'pixi.js';

export {};

const app = new Application({});

await app.init({
  background: 'cornflowerblue',
  resizeTo: window,
});

let obj = new Graphics().rect(500, 200, 400, 300).fill(0xff0000);

// Add it to the stage to render
app.stage.addChild(obj);

document.getElementById('canvas')!.append(app.canvas);
