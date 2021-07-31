import './App.scss';

import { useRef, useState } from 'react';

import { Camera, CameraStatus, SudokuScanner, SudokuSolver } from './components';

export default function App() {
  const [cameraStatus, setCameraStatus] = useState(CameraStatus.Loading);
  const [cameraMounted, setCameraMounted] = useState(true);
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

        {cameraStatus === CameraStatus.Active && (
          <SudokuScanner source={videoRef.current} onFound={sudoku => console.log(sudoku)} />
        )}

        <SudokuSolver />
      </main>
      <footer>
        <nav>
          <button type="button">Upload</button>
        </nav>
      </footer>
    </div>
  );
}
