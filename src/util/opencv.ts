import { measureSides } from './maths';

const BOX_DETECTION_THRESHOLD = 0.01;
const SQUARE_SHAPE_THRESHOLD = 0.7;
const MIN_SQUARE_AREA = 0.1;
const MAX_SQUARE_SIZE = 0.99;

/**
 * Because contours are just a list of numbers, e.g. [x1, y1, x2, y2, x3, y3...].
 */
export const getContourPathCoords = (contour: cv.Mat): number[][] => {
  const pointVector = Array.from(contour.data32S);
  const coords = Array(4);
  for (let i = 0; i < 4; i++) coords[i] = pointVector.slice(i * 2, i * 2 + 2);

  return coords;
};

export const simplifyContour = (contour: cv.Mat): cv.Mat => {
  const simplified = new cv.Mat();
  const epsilon = BOX_DETECTION_THRESHOLD * cv.arcLength(contour, true);

  cv.approxPolyDP(contour, simplified, epsilon, true);
  return simplified;
};

export const isContourSquarish = (contour: cv.Mat, container: cv.Mat): boolean => {
  const sizeLimit = Math.max(container.rows, container.cols) * MAX_SQUARE_SIZE;
  const minArea = container.rows * container.cols * MIN_SQUARE_AREA;
  const sides = contour.size().height;
  const area = cv.contourArea(contour);

  if (sides === 4 && area >= minArea) {
    const coords = getContourPathCoords(contour);

    // Check that all sides are within ~70% of the longest side.
    const sortedLengths = measureSides(coords).sort();
    const longest = sortedLengths.pop();
    if (!longest) return false;

    return (
      longest < sizeLimit &&
      sortedLengths.every(length => length > SQUARE_SHAPE_THRESHOLD * longest)
    );
  }

  return false;
};
