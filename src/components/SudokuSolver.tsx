import { useCallback, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

import { SudokuScanner } from '../services';
import { getFrame, loadCameraStream, turnOffCamera } from '../util/camera';

export default function SudokuSolver() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef(0);

  const processStream = useCallback((input: HTMLVideoElement, output: HTMLCanvasElement) => {
    const frame = getFrame(input);

    if (frame && canvasRef.current) {
      const scanner = new SudokuScanner(frame);
      scanner.extractSudokuImage(canvasRef.current);
      scanner.destruct();
    }

    streamRef.current = requestAnimationFrame(() => processStream(input, output));
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return () => {};
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const init = async () => {
      await loadCameraStream(video, { width: 500, height: 500 });
      processStream(video, canvas);
    };

    init();

    return () => {
      cancelAnimationFrame(streamRef.current);
      turnOffCamera(video);
    };
  }, [processStream]);

  return (
    <>
      <h1>🧮 Sudoku Solver</h1>
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} />
      <table id="grid1" />
    </>
  );
}
