// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import { ImageData } from 'canvas';
import { writeFileSync } from 'fs';

global.cv = require('opencv4js');

declare global {
  namespace NodeJS {
    interface Global {
      /** Test helper, for visual debugging! 🔍 */
      saveCanvas(canvas: HTMLCanvasElement, filename: string): void;
    }
  }
}
export default global;

global.ImageData = ImageData;
global.saveCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const dataURL = canvas.toDataURL();
  const base64String = dataURL.replace(/^data:image\/\w+;base64,/, '');

  writeFileSync(filename, Buffer.from(base64String, 'base64'));
};
