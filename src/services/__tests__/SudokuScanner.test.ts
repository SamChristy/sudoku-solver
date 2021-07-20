import { loadImage } from 'canvas';
import path from 'path';

import { canvasToBuffer } from '../../util/canvas';
import { SudokuScanner } from '../index';

const { listNonHiddenFiles } = global;
const testImageDir = `${__dirname}/samples`;
const testSnapshotDir = `${testImageDir}/../__image_snapshots__`;

it('loads dependencies without crashing', () => {
  const scanner = new SudokuScanner(document.createElement('canvas'));
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

// Most of the time is spent comparing the images, so it's only about 5% slower to reprocess the
// entire image set (giving the benefit of more accurate failures).
describe.each(listNonHiddenFiles(testImageDir))('extracts numbers', filename =>
  test(filename, async () => {
    const inputCanvas = document.createElement('canvas');
    const ctx = inputCanvas.getContext('2d');
    const image = await loadImage(`${testImageDir}/${filename}`);

    inputCanvas.width = image.width;
    inputCanvas.height = image.height;
    ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

    const scanner = new SudokuScanner(inputCanvas);
    scanner
      .extractDigits()
      ?.flat()
      .forEach(
        digitCanvas =>
          digitCanvas &&
          expect(canvasToBuffer(digitCanvas)).toMatchImageSnapshot({
            customSnapshotsDir: `${testSnapshotDir}/${path.parse(filename).name}-digits`,
          })
      );
    scanner.destruct();
  })
);
