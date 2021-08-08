import { RefObject, useCallback, useEffect, useState } from 'react';

import { SudokuScanner as SudokuScannerService } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';
import { getFrame } from '../util/camera';

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
      const frame = getFrame(source.current);
      if (frame) {
        const scanner = new SudokuScannerService(frame);
        found = scanner.extractSudokuImage(output.current);
        found && setDigitImages(scanner.extractDigits());
        scanner.destruct();
      }
    }

    const timeTaken = Date.now() - start;
    !found && window.setTimeout(scanSource, 1000 / scanHz - timeTaken);
  }, [output, scanHz, source]);

  useEffect(() => {
    if (scannerLoaded === null) {
      SudokuScannerService.loadDependencies().then(() => {
        scanSource();
        setScannerLoaded(true);
      });
      setScannerLoaded(false);
    }
  }, [scanSource, scannerLoaded]);

  return [scannerLoaded, digitImages];
}
