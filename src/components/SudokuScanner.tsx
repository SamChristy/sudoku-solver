import { RefObject, useEffect, useRef } from 'react';

import { useReader, useScanner } from '../hooks';
import { Sudoku } from '../types/interfaces/SudokuSolver';
import LoadingGrid from './Animations/LoadingGrid';
import Overlay from './Overlay';
import styles from './SudokuScanner.module.scss';

/**
 * Visual UI, designed to be rendered on top of the <video> element that is its source. The video
 * source is scanned for Sudoku-like objects.
 */
export default function SudokuScanner({ source, onFound, scanHz }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scannerLoaded, digitImages] = useScanner(source, canvasRef, scanHz);
  const [readerLoaded, sudoku] = useReader(digitImages);

  let loadingMessage = '';
  if (!scannerLoaded) loadingMessage = 'Please wait while the scanner loads...';
  else if (digitImages && !readerLoaded) loadingMessage = 'Please wait while the reader loads...';

  useEffect(() => {
    sudoku && onFound(sudoku);
  }, [onFound, sudoku]);

  // Both the SudokuScanner and TextReader have large (~10+ MB) dependencies to load (which, even
  // if cached, can still take several seconds to parse). We want to make the experience seem as
  // fast as possible for the user; so we proceed as far as we can at each step, before hitting a
  // roadblock (where we are forced to display a "this library is loading..." message).
  return (
    <div className={styles.sudokuScanner}>
      <canvas ref={canvasRef} />
      {loadingMessage && (
        <div className={styles.loadingMessage}>
          <LoadingGrid />
          <span>{loadingMessage}</span>
        </div>
      )}
      {!sudoku && <Overlay />}
    </div>
  );
}

type Props = {
  source: RefObject<HTMLVideoElement>;
  onFound(sudoku: Sudoku): void;
  scanHz?: number;
};
