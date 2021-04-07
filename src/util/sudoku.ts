export const extractSudoku = (src: cv.Mat) => {
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(src, src, new cv.Size(11, 11), 0, 0, cv.BORDER_DEFAULT);
  cv.adaptiveThreshold(src, src, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 5, 3);

  const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
  cv.erode(src, src, kernel);
  kernel.delete();
};

export const solveSudoku = (sudoku: number[][]) => {};
