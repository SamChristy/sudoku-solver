import { useOpenCv } from 'opencv-react';
import { useEffect, useRef } from 'react';

import { loadCameraStream } from '../util/camera';

export default function SudokuSolver() {
  const { cv } = useOpenCv();
  console.log('Loaded 👍', cv);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) loadCameraStream(videoRef.current);
  }, [videoRef]);

  return (
    <>
      <h1>🧮 Sudoku Solver</h1>
      <video ref={videoRef} muted />
    </>
  );
}
