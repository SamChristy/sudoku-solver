import { closest, measureSides } from './geometry';

const BOX_DETECTION_THRESHOLD = 0.01;
const SQUARE_SHAPE_THRESHOLD = 0.7;
const MIN_SQUARE_AREA = 0.1;
const MAX_SQUARE_SIZE = 0.99;
const EMPTY_THRESHOLD = 100;
const MIN_CHAR_AREA = 0.15;
const MAX_CHAR_AREA = 0.95;

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

  // Find the corners of the contour (this won't work if the grid is too close to 45°).
  const contourCoords = getContourPathCoords(rectangleContour);
  const topLeft = closest([0, 0], contourCoords);
  const topRight = closest([sourceWidth, 0], contourCoords);
  const bottomLeft = closest([0, sourceHeight], contourCoords);
  const bottomRight = closest([sourceWidth, sourceHeight], contourCoords);

  // Produce a transformation matrix and apply it to the warp
  // see: https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
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

export const split = (src: cv.Mat, rows: number, columns: number): cv.Mat[][] => {
  const squares: cv.Mat[][] = new Array(rows);
  const squareWidth = src.cols / columns;
  const squareHeight = src.rows / rows;

  for (let r = 0; r < rows; r++) {
    squares[r] = new Array(columns);
    for (let c = 0; c < columns; c++) {
      const x = c * squareWidth;
      const y = r * squareHeight;
      // @ts-ignore
      const crop = new cv.Rect(x, y, squareWidth, squareHeight);
      squares[r][c] = src.roi(crop);
    }
  }

  return squares;
};

export const isEmpty = (src: cv.Mat) => {
  const mean = new cv.Mat(1, 4, cv.CV_64F);
  const stdDev = new cv.Mat(1, 4, cv.CV_64F);
  cv.meanStdDev(src, mean, stdDev);

  // console.log(mean.doubleAt(0, 0));
  // @ts-ignore
  return Math.round(mean.doubleAt(0, 0));

  // @ts-ignore -- TODO Add missing CV type definitions, to avoid @ts-ignores
  return mean.doubleAt(0, 0) >= EMPTY_THRESHOLD;
};

/**
 * Tesseract is notoriously bad at extracting text from table cells; so we need help it out, by
 * cropping the cell's contents to remove any edges (which can be mistaken for characters).
 */
export const cropCellBorders = (src: cv.Mat): cv.Mat => {
  const minArea = MIN_CHAR_AREA * src.rows * src.cols;
  const maxArea = MAX_CHAR_AREA * src.rows * src.cols;
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const red = new cv.Scalar(255, 0, 0);
  const green = new cv.Scalar(0, 255, 0);
  const dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

  cv.findContours(src, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const cellArea = src.rows * src.cols;
    const rect = cv.boundingRect(contour);
    const area = rect.width * rect.height;

    if (area > 0.1 * cellArea && area < 0.8 * cellArea) {
      console.log(Math.round((area / cellArea) * 100));
      cv.drawContours(dst, contours, i, green, 1, cv.LINE_AA, hierarchy);

      // @ts-ignore
      const point1 = new cv.Point(rect.x, rect.y);
      // @ts-ignore
      const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      cv.rectangle(dst, point1, point2, red, 2, cv.LINE_AA, 0);
    }
    contour.delete();
  }

  contours.delete();
  hierarchy.delete();

  return dst;
};
