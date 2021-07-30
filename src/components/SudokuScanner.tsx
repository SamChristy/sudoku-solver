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
    let found = !!digitImages;

    if (source && canvasRef.current) {
      const frame = getFrame(source);
      if (frame) {
        const scanner = new SudokuScannerService(frame);
        found = scanner.extractSudokuImage(canvasRef.current);

        if (found) setDigitImages(scanner.extractDigits());
        scanner.destruct();
      }
    }

    const timeTaken = Date.now() - start;
    !found && window.setTimeout(processStream, 1000 / FPS_LIMIT - timeTaken);
  }, [source, digitImages]);

  useEffect(() => {
    if (!digitImages) {
      SudokuScannerService.loadDependencies().then(() => {
        processStream();
        setScannerLoaded(true);
      });
      reader.load().then(() => setReaderLoaded(true));
    } else
      Promise.all(
        digitImages.map(row =>
          Promise.all(row.map(digit => (digit ? 5 || reader.extractSingle(digit) : null)))
        )
      ).then(sudoku => onFound(sudoku));

    return () => {
      reader.destruct();
    };
  }, [digitImages, onFound, processStream, reader]);

  return (
    <div>
      <canvas ref={canvasRef} />
      {!scannerLoaded && 'Please wait while the scanner loads...'}
      {digitImages && !readerLoaded && 'Please wait while the reader loads...'}
    </div>
  );
}

type Props = { source: HTMLVideoElement | null; onFound(sudoku: Sudoku): void };
