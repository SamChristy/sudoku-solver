import { useCallback, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

import { getFrame, loadCameraStream, turnOffCamera } from '../util/camera';
import { extractSudoku } from '../util/sudoku';

export default function SudokuSolver() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const processStream = useCallback((input: HTMLVideoElement, output: HTMLCanvasElement) => {
    const frameData = cv.matFromImageData(getFrame(input));
    const result = extractSudoku(frameData);

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
          tessedit_ocr_engine_mode: 2,
          // @ts-ignore
          tessedit_pageseg_mode: '10',
          tessedit_char_whitelist: '0123456789',
          user_defined_dpi: '300',
        });
        Array.from(document.querySelectorAll('img')).reduce(async (previousPromise, img, i) => {
          await previousPromise;

          return worker.recognize(img).then(({ data }) => {
            console.warn(data);
            const b = document.createElement('b');
            b.textContent = data.text.slice(0, 1); // Tesseract sometimes returns multiple chars!
            img.parentNode?.append(b, `(${Math.round(data.confidence)})`);
          });
        }, Promise.resolve());
      })();
    }
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
      cancelAnimationFrame(frameRef.current);
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
