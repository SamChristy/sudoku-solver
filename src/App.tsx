import './App.scss';

import { useRef } from 'react';

import { CameraFeed, SudokuScanner, SudokuSolver } from './components';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      <header>
        <h1>🧮 Sudoku Solver</h1>
      </header>
      <main>
        {/* eslint-disable-next-line no-console */}
        <CameraFeed ref={videoRef} onLoad={() => console.log('camera loaded.')} />
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
