import { useCallback, useEffect, useRef } from 'react';

import { getFrame, loadCameraStream, turnOffCamera } from '../util/camera';
import { findSudokuGrid } from '../util/sudoku';

export default function SudokuSolver() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const processStream = useCallback((input: HTMLVideoElement, output: HTMLCanvasElement) => {
    const frameData = cv.matFromImageData(getFrame(input));

    const result = findSudokuGrid(frameData);
    cv.imshow(output, result);

    result.delete();
    frameData.delete();

    frameRef.current = requestAnimationFrame(() => processStream(input, output));
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return () => {};
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const init = async () => {
      await loadCameraStream(video, { width: 800, height: 800 });
      processStream(video, canvas);
    };

    init();

    return () => {
      cancelAnimationFrame(frameRef.current);
      turnOffCamera(video);
    };
  }, [processStream]);

  return (
    <>
      <h1>🧮 Sudoku Solver</h1>
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <table id="grid1" />
    </>
  );
}
