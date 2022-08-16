import { useCallback, useEffect, useMemo, useState } from 'react';

import { TextReader } from '../services';
import { SudokuDigitImages } from '../types/interfaces/SudokuScanner';
import { Sudoku } from '../types/interfaces/SudokuSolver';

export default function useReader(
  digitImages: SudokuDigitImages | null
): [boolean | null, Sudoku | null] {
  const [readerLoaded, setReaderLoaded] = useState<boolean | null>(null);
  const [sudoku, setSudoku] = useState<Sudoku | null>(null);
  const digitReader = useMemo(() => new TextReader({ whitelist: '123456789', single: true }), []);

  /**
   * Runs OCR on `digitImages`, if is populated. The resulting 2D array of numbers, is used to
   * build a Sudoku object, which is returned to the parent via `onFound()`.
   */
  const readPendingDigits = useCallback(
    () =>
      digitImages &&
      Promise.all(
        digitImages.map(row =>
          Promise.all(
            row.map(async digit => (digit ? parseInt(await digitReader.read(digit), 10) || 0 : 0))
          )
        )
      ).then(setSudoku),
    [digitImages, digitReader]
  );

  useEffect(() => {
    if (readerLoaded === null) {
      digitReader.load().then(() => {
        readPendingDigits();
        setReaderLoaded(true);
      });
      setReaderLoaded(false);
    }
    readerLoaded && readPendingDigits();
  }, [digitImages, digitReader, readPendingDigits, readerLoaded]);

  useEffect(
    () => () => {
      // It's safer to call the destructor here, in case the component is unmounted before a sudoku
      // is found.
      digitReader.destruct(); // TODO: Move scanner and reader into global or parent state.
    },
    [digitReader]
  );

  return [readerLoaded, sudoku];
}
