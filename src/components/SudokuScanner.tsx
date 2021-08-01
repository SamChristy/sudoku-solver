import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DigitReader, SudokuScanner as SudokuScannerService } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';
import { Sudoku } from '../types/interfaces/SudokuSolver';
import { getFrame } from '../util/camera';

/**
 * Visual UI, designed to be rendered on top of the <video> element that is its source. The video
 * source is scanned for Sudoku-like objects.
 */
export default function SudokuScanner({ source, onFound, scanHz = 30 }: Props) {
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [readerLoaded, setReaderLoaded] = useState(false);
  const [digitImages, setDigitImages] = useState<SudokuDigitImages | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reader = useMemo(() => new DigitReader(), []);

  /**
   * Continuously scan the source video, until a sudoku-like image is found.
   */
  const scanSource = useCallback(() => {
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
    !found && window.setTimeout(scanSource, 1000 / scanHz - timeTaken);
  }, [scanHz, source]);

  /**
   * Runs OCR on `digitImages`, if is populated. The resulting 2D array of numbers, is used to
   * build a Sudoku object, which is returned to the parent via `onFound()`.
   */
  const readPendingDigits = useCallback(
    () =>
      digitImages &&
      Promise.all(
        digitImages.map(row => Promise.all(row.map(digit => (digit ? reader.read(digit) : null))))
      ).then(onFound),
    [digitImages, onFound, reader]
  );

  useEffect(() => {
    // Both the SudokuScanner and TextReader have large (~10+ MB) dependencies to load (which, even
    // if cached, can still take several seconds to parse). We want to make the experience seem as
    // fast as possible for the user; so we proceed as far as we can at each step, before hitting a
    // roadblock (where we are forced to display a "this library is loading..." message).
    if (!loadingStarted) {
      SudokuScannerService.loadDependencies().then(() => {
        scanSource();
        setScannerLoaded(true);
      });
      reader.load().then(() => {
        readPendingDigits();
        setReaderLoaded(true);
      });
      setLoadingStarted(true);
    }
  }, [loadingStarted, readPendingDigits, reader, scanSource]);

  useEffect(() => {
    if (readerLoaded) readPendingDigits();
  }, [readPendingDigits, readerLoaded]);

  useEffect(
    () => () => {
      // It's safer to call the destructor here, in case the component is unmounted before a sudoku
      // is found.
      // TODO: Move scanner and reader into global or parent state.
      reader.destruct();
    },
    [reader]
  );

  return (
    <div>
      {!scannerLoaded && 'Please wait while the scanner loads...'}
      {digitImages && !readerLoaded && 'Please wait while the reader loads...'}
      <canvas ref={canvasRef} />
    </div>
  );
}

type Props = { source: HTMLVideoElement | null; onFound(sudoku: Sudoku): void; scanHz?: number };
