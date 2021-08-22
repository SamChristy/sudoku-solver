import { cover } from 'intrinsic-scale';
import { RefObject, useCallback, useEffect, useState } from 'react';

import { SudokuScanner as SudokuScannerService } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';

// This results in an optimal character height for OCR, see:  https://groups.google.com/g/tesseract-ocr/c/Wdh_JJwnw94/m/24JHDYQbBQAJ
const SUDOKU_SIZE = 540;
const buffer = document.createElement('canvas');
buffer.width = SUDOKU_SIZE;
buffer.height = SUDOKU_SIZE;

const getFrame = (video: HTMLVideoElement, mask: HTMLElement): ImageData | null => {
  const { width: displayWidth, height: displayHeight } = video.getBoundingClientRect();
  const { width: scaledWidth, height: scaledHeight, x: cropX, y: cropY } = cover(
    displayWidth,
    displayHeight,
    video.videoWidth,
    video.videoHeight
  );
  const scale = cropX ? video.videoHeight / scaledHeight : video.videoWidth / scaledWidth;
  const videoMask = {
    x: scale * (mask.offsetLeft - video.offsetLeft - cropX),
    y: scale * (mask.offsetTop - video.offsetTop - cropY),
    width: scale * mask.offsetWidth,
    height: scale * mask.offsetHeight,
  };

  const ctx = buffer.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(
    video,
    videoMask.x,
    videoMask.y,
    videoMask.width,
    videoMask.height,
    0,
    0,
    buffer.width,
    buffer.height
  );

  return ctx.getImageData(0, 0, buffer.width, buffer.height);
};

export default function useScanner(
  source: RefObject<HTMLVideoElement>,
  output: RefObject<HTMLCanvasElement>,
  scanHz = 30
): [boolean | null, SudokuDigitImages | null] {
  const [scannerLoaded, setScannerLoaded] = useState<boolean | null>(null);
  const [digitImages, setDigitImages] = useState<SudokuDigitImages | null>(null);

  // Continuously scan the source video, until a sudoku-like image is found.
  const scanSource = useCallback(() => {
    const start = Date.now();
    let found = false;

    if (source.current && output.current) {
      const frame = getFrame(source.current, output.current);
      if (frame) {
        const scanner = new SudokuScannerService(frame);
        found = scanner.extractSudokuImage(output.current);
        found && setDigitImages(scanner.extractDigits());
        scanner.destruct();
      }
    }

    const timeTaken = Date.now() - start;
    !found && setTimeout(scanSource, 1000 / scanHz - timeTaken);
  }, [output, scanHz, source]);

  useEffect(() => {
    if (scannerLoaded === null) {
      SudokuScannerService.loadDependencies().then(() => {
        // Prevent blocking the main thread for too long, so the browser doesn't think we're mining
        // bitcoin! 😆
        setTimeout(scanSource, 100);
        setScannerLoaded(true);
      });
      setScannerLoaded(false);
    }
  }, [scanSource, scannerLoaded]);

  return [scannerLoaded, digitImages];
}
