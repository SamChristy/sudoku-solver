import { cropAndFlatten, isContourSquarish, simplifyContour, split } from './cv';

const ROWS = 9;
const COLUMNS = 9;
const BLUR_RADIUS = 11;
const LINE_COLOUR = 255;
const THRESHOLD_BLUR_RADIUS = 5;
const THRESHOLD_NORM = 2;

export const findSudokuGrid = (src: cv.Mat): cv.Mat => {
  const original = src.clone();
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

  // Find the largest squares in the image and try to work out whether or not they're sudokus,
  // choosing the best suitable candidate.
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const green = new cv.Scalar(0, 255, 0);
  const dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

  cv.findContours(src, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  let largestArea = 0;
  let largestSquare = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const simplified = simplifyContour(contour);

    if (isContourSquarish(simplified, src)) {
      const area = cv.contourArea(simplified);
      if (area > largestArea) {
        largestArea = area;
        largestSquare = simplified.clone();
      }

      cv.drawContours(dst, contours, i, green, 1, cv.LINE_AA, hierarchy);
    }

    contour.delete();
    simplified.delete();
  }

  contours.delete();
  hierarchy.delete();

  if (largestSquare !== null) {
    const croppedOriginal = cropAndFlatten(original, largestSquare);

    const squares = split(croppedOriginal, ROWS, COLUMNS);
    console.log(squares);
    squares.forEach(row => row.forEach(mat => mat.delete()));

    const mean = new cv.Mat(1, 4, cv.CV_64F);
    const stdDev = new cv.Mat(1, 4, cv.CV_64F);
    cv.meanStdDev(croppedOriginal, mean, stdDev);

    console.log(mean.doubleAt(0, 0));

    dst.delete();
    original.delete();
    largestSquare?.delete();

    return croppedOriginal;
  }

  original.delete();

  //    - Just slice the image into 81 squares, cropping by a sensible amount and hope for the best
  //      🤞 + use cv.meanStdDev() to identify empty squares

  return dst;
};

export const solveSudoku = (sudoku: number[][]) => {};
