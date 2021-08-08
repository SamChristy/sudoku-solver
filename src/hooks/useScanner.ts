import { useEffect, useState } from 'react';

import { SudokuScanner as SudokuScannerService } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';
import { getFrame } from '../util/camera';

export default function useScanner(
  source: HTMLVideoElement | null,
  output: HTMLCanvasElement | null,
  scanHz = 30
): [boolean, SudokuDigitImages | null] {
  const [scannerLoaded, setScannerLoaded] = useState<boolean>(false);
  const [digitImages, setDigitImages] = useState<SudokuDigitImages | null>(null);

  useEffect(() => {
    // Continuously scan the source video, until a sudoku-like image is found.
    const scanSource = () => {
      const start = Date.now();
      let found = false;

      if (source && output) {
        const frame = getFrame(source);
        if (frame) {
          const scanner = new SudokuScannerService(frame);
          found = scanner.extractSudokuImage(output);
          found && setDigitImages(scanner.extractDigits());
          scanner.destruct();
        }
      }

      const timeTaken = Date.now() - start;
      !found && window.setTimeout(scanSource, 1000 / scanHz - timeTaken);
    };

    output &&
      !digitImages &&
      SudokuScannerService.loadDependencies().then(() => {
        scanSource();
        setScannerLoaded(true);
      });
  }, [digitImages, output, scanHz, source]);

  return [scannerLoaded, digitImages];
}
