import './App.scss';

import { useRef, useState } from 'react';

import { CameraFeed, CameraStatus, SudokuScanner, SudokuSolver } from './components';

export default function App() {
  const [cameraStatus, setCameraStatus] = useState(CameraStatus.Loading);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div>
      <header>
        <h1>🧮 Sudoku Solver</h1>
      </header>
      <main>
        <h2>
          {
            {
              [CameraStatus.Loading]: '⏳',
              [CameraStatus.Active]: '🎥',
              [CameraStatus.Denied]: '✋',
              [CameraStatus.Unavailable]: '🚫',
            }[cameraStatus]
          }
        </h2>
        <CameraFeed ref={videoRef} onStatusUpdate={setCameraStatus} />
        <SudokuScanner />
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
