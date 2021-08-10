import { useRef, useState } from 'react';

import styles from './App.module.scss';
import { Camera, CameraStatus, Overlay, SudokuScanner, SudokuSolver } from './components';
import { Sudoku } from './types/interfaces/SudokuSolver';

export default function App() {
  const [cameraStatus, setCameraStatus] = useState(CameraStatus.Loading);
  const [sudoku, setSudoku] = useState<Sudoku | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={styles.app}>
      <header>
        <h1>🧮 Sudoku Solver</h1>
      </header>
      <div>
        <Camera ref={videoRef} onStatusUpdate={setCameraStatus} />
        <main>
          {cameraStatus === CameraStatus.Active && !sudoku && (
            <SudokuScanner source={videoRef} scanHz={10} onFound={setSudoku} />
          )}
          {sudoku && <SudokuSolver sudoku={sudoku} />}
          <Overlay corners={!sudoku} />
        </main>
        <footer>
          <nav>
            {sudoku && (
              <button type="button" onClick={() => setSudoku(null)}>
                Reset
              </button>
            )}
          </nav>
        </footer>
      </div>
    </div>
  );
}
