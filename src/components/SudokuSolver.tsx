import { useCallback, useEffect, useRef } from 'react';

import { SudokuScanner } from '../services';
import DigitExtractor from '../services/DigitExtractor/DigitExtractor';
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
      // TODO: Turn off camera on tab change & test stop/starting robustness
      await loadCameraStream(video, { width: 500, height: 500 });
      processStream(video, canvas);
    };

    init();
    (async () => {
      const extractor = new DigitExtractor();
      await extractor.load();
      const digit = await extractor.extractSingle(`${process.env.PUBLIC_URL}/7.png`);

      extractor.destruct();
      // eslint-disable-next-line no-console
      console.log('extracted', digit);
    })();

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
