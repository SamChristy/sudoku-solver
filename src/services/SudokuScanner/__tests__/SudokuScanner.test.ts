import { loadImage } from 'canvas';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import cv from 'opencv4js';
import path from 'path';

import { canvasToBuffer } from '../../../util/canvas';
import SudokuScanner from '../SudokuScanner';

global.cv = cv;
expect.extend({ toMatchImageSnapshot });

const { listNonHiddenFiles } = global;
const sampleImageDir = path.join(__dirname, 'samples');
const blurrySampleImageDir = path.join(__dirname, 'blurry-samples');
const testSnapshotDir = path.join(sampleImageDir, '..', '__image_snapshots__');

it('loads without crashing', () => {
  const scanner = new SudokuScanner(document.createElement('canvas'));
  scanner.destruct();
});

it("throws error, if OpenCV isn't loaded", () => {
  const instantiateSudokuScannerWithoutOpenCV = () => {
    // @ts-ignore -- this is the point of the test! 😁
    global.cv = undefined;

    try {
      const scanner = new SudokuScanner(document.createElement('canvas'));
      scanner.destruct();
    } catch (e) {
      global.cv = cv;
      throw e;
    }
  };

  expect(instantiateSudokuScannerWithoutOpenCV).toThrowError();
});

it('reads image without crashing', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${sampleImageDir}/dog.jpg`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  scanner.destruct();
});

describe.each(listNonHiddenFiles(sampleImageDir))('finds and extracts sudoku puzzle', filename =>
  test(filename, async () => {
    // FIXME: Adjust size thresholding to accommodate designs 1 & 3.
    const ignored = ['design-1.jpg', 'design-3.jpg'];
    if (ignored.includes(filename)) return;

    const inputCanvas = document.createElement('canvas');
    const outputCanvas = document.createElement('canvas');
    const ctx = inputCanvas.getContext('2d');
    const image = await loadImage(`${sampleImageDir}/${filename}`);

    inputCanvas.width = image.width;
    inputCanvas.height = image.height;
    ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

    const scanner = new SudokuScanner(inputCanvas);
    scanner.extractSudokuImage(outputCanvas);
    scanner.destruct();

    expect(canvasToBuffer(outputCanvas)).toMatchImageSnapshot();
  })
);

describe.each(listNonHiddenFiles(blurrySampleImageDir))('rejects blurry images', filename =>
  test(filename, async () => {
    const inputCanvas = document.createElement('canvas');
    const outputCanvas = document.createElement('canvas');
    const ctx = inputCanvas.getContext('2d');
    const image = await loadImage(`${blurrySampleImageDir}/${filename}`);

    inputCanvas.width = image.width;
    inputCanvas.height = image.height;
    ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

    const scanner = new SudokuScanner(inputCanvas);
    const result = scanner.extractSudokuImage(outputCanvas);
    scanner.destruct();

    expect(result).toBeFalse();
  })
);

// Most of the time is spent comparing the images, so it's only about 5% slower to reprocess the
// entire image set (giving the benefit of more accurate failures).
describe.each(listNonHiddenFiles(sampleImageDir))('extracts numbers', filename =>
  test(filename, async () => {
    const inputCanvas = document.createElement('canvas');
    const ctx = inputCanvas.getContext('2d');
    const image = await loadImage(`${sampleImageDir}/${filename}`);

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
