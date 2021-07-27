import { useEffect, useMemo, useState } from 'react';

import { DigitReader, SudokuScanner as SudokuScannerService } from '../services';

export default function SudokuScanner() {
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [readerLoaded, setReaderLoaded] = useState(false);
  const reader = useMemo(() => new DigitReader(), []);

  useEffect(() => {
    SudokuScannerService.loadDependencies().then(() => setScannerLoaded(true));
    reader.load().then(() => setReaderLoaded(true));

    return () => {
      reader.destruct();
    };
  }, [reader]);

  return (
    <table>
      <tbody>
        <tr>
          <td>scannerLoaded: </td>
          <td>{scannerLoaded ? '✅' : '⏳'}</td>
        </tr>
        <tr>
          <td>readerLoaded: </td>
          <td>{readerLoaded ? '✅' : '⏳'}</td>
        </tr>
      </tbody>
    </table>
  );
}
