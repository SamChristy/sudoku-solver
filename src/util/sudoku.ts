import { measureSides } from './maths';

const BLUR_RADIUS = 11;
const LINE_COLOUR = 255;
const THRESHOLD_BLUR_RADIUS = 5;
const THRESHOLD_NORM = 2;
const THICKNESS_INCREASE = 0; // 👈 Do we need this stage? 🤔
const BOX_DETECTION_THRESHOLD = 0.01;
const MIN_SQUARE_SIZE = 10000;
const SQUARE_SHAPE_THRESHOLD = 0.7;
const CONTOUR_LENGTH_LIMIT = 797; // TODO: Calculate dynamically!

const simplifyShape = (contour: cv.Mat): cv.Mat => {
  const simplified = new cv.Mat();
  const epsilon = BOX_DETECTION_THRESHOLD * cv.arcLength(contour, true);

  cv.approxPolyDP(contour, simplified, epsilon, true);
  return simplified;
};

const isSquarish = (contour: cv.Mat): boolean => {
  const sides = contour.size().height;
  const area = cv.contourArea(contour);
  const pointVector = Array.from(contour.data32S);

  if (sides === 4 && area >= MIN_SQUARE_SIZE) {
    const coords = Array(4);
    for (let i = 0; i < 4; i++) coords[i] = pointVector.slice(i * 2, i * 2 + 2);

    // Check that all sides are within ~70% of the longest side.
    const sortedLengths = measureSides(coords).sort();
    const longest = sortedLengths.pop();
    if (!longest) return false;

    return (
      longest < CONTOUR_LENGTH_LIMIT &&
      sortedLengths.every(length => length > SQUARE_SHAPE_THRESHOLD * longest)
    );
  }

  return false;
};

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

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const simplified = simplifyShape(contour);

    if (isSquarish(simplified)) {
      cv.drawContours(dst, contours, i, green, 1, cv.LINE_AA, hierarchy);

      // const rotatedRect = cv.minAreaRect(contour);
      // // @ts-ignore
      // const vertices = cv.RotatedRect.points(rotatedRect);
      // const red = new cv.Scalar(255, 0, 0);
      // // draw rotatedRect
      // for (let j = 0; j < 4; j++)
      //   cv.line(dst, vertices[j], vertices[(j + 1) % 4], red, 1, cv.LINE_AA, 0);
    }

    contour.delete();
    simplified.delete();
  }

  // TODO:
  //    1. Find all rectangles above a certain size (e.g. 25% of viewport).
  //      1.1 ☝️ a frame guide would really help here.
  //    2. Sort the rectangles by descending order of size.
  //    3. For each rectangle:
  //      3.1 Look for at least ~30 similarly-sized rectangles inside it!?
  //        🤔 Or maybe just some text ROI!?
  //      3.2 Look for some rectangles ~1/9th the height and width!?
  //          or ~1/3, as they sometimes come through
  //
  //   We have our grid, now:
  //    - Transform grid, to "flatten it out".
  //    - Just slice the image into 81 squares, cropping by a sensible amount and hope for the best
  //      🤞 + somehow identify & ignore empty squares...

  contours.delete();
  hierarchy.delete();

  return dst;
};

export const solveSudoku = (sudoku: number[][]) => {};
