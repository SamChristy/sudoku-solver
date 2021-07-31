import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DigitReader, SudokuScanner as SudokuScannerService } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';
import { Sudoku } from '../types/interfaces/SudokuSolver';
import { getFrame } from '../util/camera';

const FPS_LIMIT = 30;

export default function SudokuScanner({ source, onFound }: Props) {
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [readerLoaded, setReaderLoaded] = useState(false);
  const [digitImages, setDigitImages] = useState<SudokuDigitImages>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reader = useMemo(() => new DigitReader(), []);

  const processStream = useCallback(() => {
    const start = Date.now();
    let found = false;

    if (source && canvasRef.current) {
      const frame = getFrame(source);

      if (frame) {
        const scanner = new SudokuScannerService(frame);
        found = scanner.extractSudokuImage(canvasRef.current);
        found && setDigitImages(scanner.extractDigits());
        scanner.destruct();
      }
    }

    const timeTaken = Date.now() - start;
    !found && window.setTimeout(processStream, 1000 / FPS_LIMIT - timeTaken);
  }, [source]);

  useEffect(() => {
    let waitIntervalId: number | null = null;
    const readDigitsWhenReady = (images: (HTMLCanvasElement | null)[][]) => {
      if (readerLoaded) {
        console.log('starting reading 🔎');
        waitIntervalId && window.clearInterval(waitIntervalId);
        Promise.all(
          images.map(row =>
            Promise.all(row.map(digit => (digit ? reader.extractSingle(digit) : null)))
          )
        ).then(sudoku => {
          onFound(sudoku);
          window.setTimeout(() => reader.destruct());
        });
      } else if (waitIntervalId === null)
        waitIntervalId = window.setInterval(() => readDigitsWhenReady(images), 10);

      console.log('wait...');
    };

    if (!digitImages) {
      SudokuScannerService.loadDependencies().then(() => {
        processStream();
        setScannerLoaded(true);
      });
      reader.load().then(() => setReaderLoaded(true));
    } else {
      console.log('readDigitsWhenReady()');
      readDigitsWhenReady(digitImages);
    }
  }, [digitImages, onFound, processStream, reader, readerLoaded]);

  return (
    <div>
      {!scannerLoaded && 'Please wait while the scanner loads...'}
      <br />
      {!readerLoaded && 'Please wait while the reader loads...'}
      <canvas ref={canvasRef} />
    </div>
  );
}

type Props = { source: HTMLVideoElement | null; onFound(sudoku: Sudoku): void };
