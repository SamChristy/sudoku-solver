import { isContourSquarish, simplifyContour } from './opencv';

const BLUR_RADIUS = 11;
const LINE_COLOUR = 255;
const THRESHOLD_BLUR_RADIUS = 5;
const THRESHOLD_NORM = 2;
const THICKNESS_INCREASE = 0; // 👈 Do we need this stage? 🤔

export const findSudokuGrid = (src: cv.Mat): cv.Mat => {
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

  if (largestSquare !== null) {
    const rotatedRect = cv.minAreaRect(largestSquare);
    // @ts-ignore
    const vertices = cv.RotatedRect.points(rotatedRect);
    const red = new cv.Scalar(255, 0, 0);
    for (let j = 0; j < 4; j++)
      cv.line(dst, vertices[j], vertices[(j + 1) % 4], red, 1, cv.LINE_AA, 0);

    largestSquare.delete();
  }

  //   We have our grid, now:
  //    - Transform grid, to "flatten it out".
  //    - Just slice the image into 81 squares, cropping by a sensible amount and hope for the best
  //      🤞 + somehow identify & ignore empty squares...

  contours.delete();
  hierarchy.delete();

  return dst;
};

export const solveSudoku = (sudoku: number[][]) => {};
