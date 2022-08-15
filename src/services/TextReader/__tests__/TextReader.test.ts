/**
 * @jest-environment node
 * Tesseract.js/jsdom fix: https://github.com/naptha/tesseract.js/issues/474#issuecomment-803472061
 */
import path from 'path';

import TextReader from '../TextReader';

const digitsDir = path.join(
  __dirname,
  ...'/../../SudokuScanner/__tests__/__image_snapshots__'.split('/')
);
// Single thread appears to perform best for some reason!
const threadCount = 1;

it('loads without crashing', () => {
  const load = async () => {
    const reader = new TextReader();
    await reader.load();
    reader.destruct();
  };

  expect(load).not.toThrowError();
});

it('reads single char in image', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();
  const digit = await reader.read(
    path.join(
      digitsDir,
      'design-3-digits',
      'sudoku-scanner-test-ts-extracts-numbers-design-3-jpg-1-snap.png'
    )
  );

  reader.destruct();
  expect(digit).toEqual('7');
}, 10000);

it('reads different styles', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['design-1-digits/sudoku-scanner-test-ts-extracts-numbers-design-1-jpg-1-snap.png', '1'],
    ['design-2-digits/sudoku-scanner-test-ts-extracts-numbers-design-2-jpg-10-snap.png', '2'],
    ['design-3-digits/sudoku-scanner-test-ts-extracts-numbers-design-3-jpg-15-snap.png', '8'],
    ['graphic-digits/sudoku-scanner-test-ts-extracts-numbers-graphic-png-5-snap.png', '5'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, ...image.split('/'));
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);

it('reads digits of different sizes', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['v-small-digits/sudoku-scanner-test-ts-extracts-numbers-v-small-jpg-1-snap.png', '1'],
    ['small-digits/sudoku-scanner-test-ts-extracts-numbers-small-jpg-2-snap.png', '4'],
    ['large-digits/sudoku-scanner-test-ts-extracts-numbers-large-jpg-9-snap.png', '8'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, ...image.split('/'));
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);

it('reads noisy digits', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-1-snap.png', '7'],
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-4-snap.png', '9'],
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-10-snap.png', '5'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, 'noisy-digits', image);
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);

it('reads noisy digits', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-1-snap.png', '7'],
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-4-snap.png', '9'],
    ['sudoku-scanner-test-ts-extracts-numbers-noisy-jpg-10-snap.png', '5'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, 'noisy-digits', image);
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);

it('reads shadowy digits', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['shadow-1-digits/sudoku-scanner-test-ts-extracts-numbers-shadow-1-jpg-1-snap.png', '1'],
    ['shadow-1-digits/sudoku-scanner-test-ts-extracts-numbers-shadow-1-jpg-16-snap.png', '3'],
    ['shadow-2-digits/sudoku-scanner-test-ts-extracts-numbers-shadow-2-jpg-19-snap.png', '9'],
    ['shadow-2-digits/sudoku-scanner-test-ts-extracts-numbers-shadow-2-jpg-26-snap.png', '6'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, ...image.split('/'));
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);

it('reads skewed digits', async () => {
  const reader = new TextReader({ threadCount });
  await reader.load();

  const input = [
    ['sudoku-scanner-test-ts-extracts-numbers-skewed-jpg-31-snap.png', '2'],
    ['sudoku-scanner-test-ts-extracts-numbers-skewed-jpg-4-snap.png', '3'],
    ['sudoku-scanner-test-ts-extracts-numbers-skewed-jpg-15-snap.png', '1'],
  ];
  await Promise.all(
    input.map(async ([image, digit]) => {
      const safePath = path.join(digitsDir, 'skewed-digits', image);
      expect(await reader.read(safePath)).toEqual(digit);
    })
  );

  reader.destruct();
}, 10000);
