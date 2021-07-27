/**
 * @jest-environment node
 * Tesseract.js/jsdom fix: https://github.com/naptha/tesseract.js/issues/474#issuecomment-803472061
 */
import path from 'path';

import DigitReader from '../DigitReader';

const digitsDir = path.join(
  __dirname,
  ...'/../../SudokuScanner/__tests__/__image_snapshots__/design-3-digits'.split('/')
);

it('loads without crashing', () => {
  const load = async () => {
    const extractor = new DigitReader();
    await extractor.load();
    extractor.destruct();
  };

  expect(load).not.toThrowError();
});

it('reads digit in image', async () => {
  const extractor = new DigitReader();
  await extractor.load();
  const digit = await extractor.extractSingle(
    path.join(digitsDir, 'sudoku-scanner-test-ts-extracts-numbers-design-3-jpg-1-snap.png')
  );

  extractor.destruct();
  expect(digit).toEqual('7');
});
