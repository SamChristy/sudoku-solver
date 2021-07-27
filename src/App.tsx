import './App.scss';

import { useRef, useState } from 'react';

import { CameraFeed, SudokuScanner, SudokuSolver } from './components';

export default function App() {
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      <header>
        <h1>🧮 Sudoku Solver</h1>
      </header>
      <main>
        <h2>{cameraOn ? '📷' : '📸'}</h2>
        <CameraFeed ref={videoRef} onLoad={() => setCameraOn(true)} />
        <SudokuScanner />
        <SudokuSolver />
      </main>
      <footer>
        <nav>
          <button type="button">Upload</button>
        </nav>
      </footer>
    </>
  );
}
