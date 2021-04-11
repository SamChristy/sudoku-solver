const BLUR_RADIUS = 11;
const LINE_COLOUR = 255;
const THRESHOLD_BLUR_RADIUS = 5;
const THRESHOLD_NORM = 2;
const THICKNESS_INCREASE = 2;

export const findSudokuGrid = (src: cv.Mat) => {
  // Grayscale, to help line-identification.
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  // Blur, to smooth out noise.
  const blurKernel = new cv.Size(BLUR_RADIUS, BLUR_RADIUS);
  cv.GaussianBlur(src, src, blurKernel, 0, 0, cv.BORDER_DEFAULT);
  // Convert to black & white (line art style!)
  cv.adaptiveThreshold(
    src,
    src,
    LINE_COLOUR,
    cv.ADAPTIVE_THRESH_MEAN_C,
    cv.THRESH_BINARY,
    THRESHOLD_BLUR_RADIUS,
    THRESHOLD_NORM
  );
  // Increase thickness of lines, to help fill in any gaps.
  const kernel = cv.Mat.ones(THICKNESS_INCREASE, THICKNESS_INCREASE, cv.CV_8U);
  cv.erode(src, src, kernel);
  kernel.delete();
};

export const solveSudoku = (sudoku: number[][]) => {};
