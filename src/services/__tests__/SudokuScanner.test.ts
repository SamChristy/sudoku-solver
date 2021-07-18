import { loadImage } from 'canvas';

import { canvasToBuffer } from '../../util/canvas';
import { SudokuScanner } from '../index';

const { listNonHiddenFiles } = global;
const testImageDir = `${__dirname}/samples`;

it('loads dependencies without crashing', () => {
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

describe.each(listNonHiddenFiles(testImageDir))('finds and extracts sudoku puzzle', filename =>
  test(filename, async () => {
    const inputCanvas = document.createElement('canvas');
    const outputCanvas = document.createElement('canvas');
    const ctx = inputCanvas.getContext('2d');
    const image = await loadImage(`${testImageDir}/${filename}`);

    inputCanvas.width = image.width;
    inputCanvas.height = image.height;
    ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

    const scanner = new SudokuScanner(inputCanvas);
    scanner.extractSudokuImage(outputCanvas);
    scanner.destruct();

    expect(canvasToBuffer(outputCanvas)).toMatchImageSnapshot();
  })
);
