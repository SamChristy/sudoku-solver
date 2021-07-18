import { loadImage } from 'canvas';
import md5 from 'md5';

import { SudokuScanner } from '../index';

const testImageDir = `${__dirname}/samples`;

it('loads without crashing', () => {
  const canvas = document.createElement('canvas');
  const scanner = new SudokuScanner(canvas);
  scanner.destruct();
});

it('loads image', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/dog.jpg`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  scanner.destruct();
});

it('scans image not containing sudoku', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/dog.jpg`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  const found = scanner.extractSudokuImage();
  scanner.destruct();

  expect(found).toBe(false);
});

it('finds sudoku in photo', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/sudoku-photo.jpg`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  const found = scanner.extractSudokuImage();
  scanner.destruct();

  expect(found).toBe(true);
});

it('finds sudoku in graphic', async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/sudoku-graphic.png`);
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(canvas);
  const found = scanner.extractSudokuImage();
  scanner.destruct();

  expect(found).toBe(true);
});

it('effectively crops and flattens sudoku photo', async () => {
  const md5Snapshot = '3d6ef67de2ceccaf5b5d0e95697a6f07';
  const inputCanvas = document.createElement('canvas');
  const outputCanvas = document.createElement('canvas');
  const ctx = inputCanvas.getContext('2d');
  const image = await loadImage(`${testImageDir}/sudoku-photo.jpg`);

  inputCanvas.width = image.width;
  inputCanvas.height = image.height;
  ctx?.drawImage((image as unknown) as ImageBitmap, 0, 0);

  const scanner = new SudokuScanner(inputCanvas);
  scanner.extractSudokuImage(outputCanvas);
  scanner.destruct();

  expect(md5(outputCanvas.toDataURL())).toBe(md5Snapshot);
});
