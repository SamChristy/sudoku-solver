/**
 * @jest-environment node
 * Tesseract.js/jsdom fix: https://github.com/naptha/tesseract.js/issues/474#issuecomment-803472061
 */
import path from 'path';

import DigitExtractor from '../DigitExtractor';

const digitsDir = path.join(
  __dirname,
  ...'/../../SudokuScanner/__tests__/__image_snapshots__/design-3-digits'.split('/')
);

it('loads without crashing', () => {
  const load = async () => {
    const extractor = new DigitExtractor();
    await extractor.load();
    extractor.destruct();
  };

  expect(load).not.toThrowError();
});

it('extracts digit from image', async () => {
  const extractor = new DigitExtractor();
  await extractor.load();
  const digit = await extractor.extractSingle(
    path.join(digitsDir, 'sudoku-scanner-test-ts-extracts-numbers-design-3-jpg-1-snap.png')
  );

  extractor.destruct();
  expect(digit).toEqual('7');
});
