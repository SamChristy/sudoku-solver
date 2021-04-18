import { closest, measureSides } from './maths';

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

export const cropAndFlatten = (src: cv.Mat, rectangleContour: cv.Mat): cv.Mat => {
  const [sourceWidth, sourceHeight] = [src.rows, src.cols];
  const flattened = cv.Mat.zeros(sourceWidth, sourceHeight, cv.CV_8UC3);
  const size = new cv.Size(sourceWidth, sourceHeight);

  // Find the corners of the contour (this doesn't always work...)
  const contourCoords = getContourPathCoords(rectangleContour);
  const topLeft = closest([0, 0], contourCoords);
  const topRight = closest([sourceWidth, 0], contourCoords);
  const bottomLeft = closest([0, sourceHeight], contourCoords);
  const bottomRight = closest([sourceWidth, sourceHeight], contourCoords);

  // Produce a "transformation matrix" and apply it to the warp
  // {@see https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html}
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ...topLeft,
    ...topRight,
    ...bottomRight,
    ...bottomLeft,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    sourceWidth,
    0,
    sourceWidth,
    sourceHeight,
    0,
    sourceHeight,
  ]);
  const transformMatrix = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(src, flattened, transformMatrix, size, cv.INTER_LINEAR, cv.BORDER_CONSTANT);

  transformMatrix.delete();
  srcTri.delete();
  dstTri.delete();

  return flattened;
};
