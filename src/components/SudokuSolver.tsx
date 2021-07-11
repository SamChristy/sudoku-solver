import { useCallback, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

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

    if (!document.getElementsByTagName('tr').length)
      frameRef.current = requestAnimationFrame(() => processStream(input, output));
    else {
      const worker = createWorker();

      (async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          // @ts-ignore
          tessedit_pageseg_mode: '10',
          tessedit_char_whitelist: '0123456789',
          user_defined_dpi: '300',
          // @ts-ignore
          tessedit_ocr_engine_mode: 0,
        });
        Array.from(document.querySelectorAll('canvas')).reduce(
          async (previousPromise, canvas, i) => {
            await previousPromise;

            if (i >= 1) {
              console.log(i);
              return worker.recognize(canvas).then(({ data }) => {
                console.warn(data);
                const b = document.createElement('b');
                b.textContent = data.text;
                canvas.parentNode?.append(b, `(${Math.round(data.confidence)})`);
              });
            }
            return Promise.resolve();
          },
          Promise.resolve()
        );
      })();
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return () => {};
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const init = async () => {
      // TODO: Experiment with different image sizes/downscaling
      //       Find that analysis of optimal height and downscale the actual chars to that!
      await loadCameraStream(video, { width: 500, height: 500 });
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
