import { useRef, useState } from 'react';

import styles from './App.module.scss';
import { Camera, CameraStatus, SudokuScanner, SudokuSolver } from './components';
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
      <main>
        <Camera ref={videoRef} onStatusUpdate={setCameraStatus} />
        {cameraStatus === CameraStatus.Active && !sudoku && (
          <SudokuScanner source={videoRef.current} onFound={setSudoku} />
        )}
        {sudoku && <SudokuSolver sudoku={sudoku} />}
      </main>
      <footer>
        <nav>
          <button type="button">Reset</button>
        </nav>
      </footer>
    </div>
  );
}
