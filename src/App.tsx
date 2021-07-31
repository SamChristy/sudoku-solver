import './App.scss';

import { useRef, useState } from 'react';

import { Camera, CameraStatus, SudokuScanner, SudokuSolver } from './components';
import { Sudoku } from './types/interfaces/SudokuSolver';

export default function App() {
  const [cameraStatus, setCameraStatus] = useState(CameraStatus.Loading);
  const [cameraMounted, setCameraMounted] = useState(true);
  const [sudoku, setSudoku] = useState<Sudoku | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div>
      <header>
        <h1>🧮 Sudoku Solver</h1>
      </header>
      <main>
        <button type="button" onClick={() => setCameraMounted(c => !c)}>
          {cameraMounted ? 'Unmount' : 'Mount'} CameraFeed
        </button>
        {cameraMounted && <Camera ref={videoRef} onStatusUpdate={setCameraStatus} />}

        {cameraStatus === CameraStatus.Active && !sudoku && (
          <SudokuScanner source={videoRef.current} onFound={setSudoku} />
        )}

        {sudoku && <SudokuSolver sudoku={sudoku} />}
      </main>
      <footer>
        <nav>
          <button type="button">Upload</button>
        </nav>
      </footer>
    </div>
  );
}
