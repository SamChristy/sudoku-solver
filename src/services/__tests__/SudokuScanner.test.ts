import { loadImage } from 'canvas';
import { readdirSync } from 'fs';
import path from 'path';

import { SudokuScanner } from '../index';

const testImageDir = `${__dirname}/samples`;
const { saveCanvas } = global;

it('loads libraries without crashing', () => {
  const canvas = document.createElement('canvas');
  const scanner = new SudokuScanner(canvas);
  scanner.destruct();
});

it('reads image without crashing', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/dog.jpg`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  scanner.destruct();
});

describe.each(readdirSync(testImageDir).filter(f => !f.startsWith('.')))(
  'finds and extracts sudoku puzzle',
  filename =>
    test(filename, async () => {
      const inputCanvas = document.createElement('canvas');
      const outputCanvas = document.createElement('canvas');
      const ctx = inputCanvas.getContext('2d');
      const image = await loadImage(`${testImageDir}/${filename}`);

      inputCanvas.width = image.width;
      inputCanvas.height = image.height;
      ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

      const scanner = new SudokuScanner(inputCanvas);
      const found = scanner.extractSudokuImage(outputCanvas);
      scanner.destruct();
      found &&
        saveCanvas(outputCanvas, `${testImageDir}/../output/${path.parse(filename).name}.png`);

      expect(found).toBe(true);
    })
);
