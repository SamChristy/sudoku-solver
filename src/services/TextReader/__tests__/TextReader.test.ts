/**
 * @jest-environment node
 * Tesseract.js/jsdom fix: https://github.com/naptha/tesseract.js/issues/474#issuecomment-803472061
 */
import path from 'path';

import TextReader from '../TextReader';

const digitsDir = path.join(
  __dirname,
  ...'/../../SudokuScanner/__tests__/__image_snapshots__/design-3-digits'.split('/')
);

it('loads without crashing', () => {
  const load = async () => {
    const reader = new TextReader();
    await reader.load();
    reader.destruct();
  };

  expect(load).not.toThrowError();
});

it('reads single char in image', async () => {
  const reader = new TextReader({ single: true, threadCount: 1 });
  await reader.load();
  const digit = await reader.read(
    path.join(digitsDir, 'sudoku-scanner-test-ts-extracts-numbers-design-3-jpg-1-snap.png')
  );

  reader.destruct();
  expect(digit).toEqual('7');
});
