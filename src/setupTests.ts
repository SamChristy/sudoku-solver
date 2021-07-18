// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import { ImageData } from 'canvas';
import { PathLike, readdirSync } from 'fs';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

declare global {
  namespace NodeJS {
    interface Global {
      listNonHiddenFiles(dir: PathLike): string[];
    }
  }
}
export default global;

expect.extend({ toMatchImageSnapshot });
global.ImageData = ImageData;
global.listNonHiddenFiles = (dir: PathLike) =>
  readdirSync(dir).filter(filename => !filename.startsWith('.'));
global.cv = require('opencv4js');
