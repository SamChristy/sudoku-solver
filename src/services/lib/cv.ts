import { closest, isPointInsideRect, measureSides, Point } from '../../util/geometry';

const BOX_DETECTION_THRESHOLD = 0.01;
const SQUARE_SHAPE_THRESHOLD = 0.7;
const MIN_SQUARE_AREA = 0.215; // TODO: Move this - and other bits - into SudokuSolver class.
const MAX_SQUARE_SIZE = 0.99;
const MIN_CHAR_AREA = 0.08;
const MAX_CHAR_AREA = 0.8;
const MIN_CHAR_ASPECT_RATIO = 0.2;
const MAX_CHAR_ASPECT_RATIO = 1.6;
/** The average lightness threshold below which a cell is assumed empty. */
const CELL_EMPTY_THRESHOLD = 230;
const CHAR_PADDING = 0.05;

/**
 * Because contours are just a list of numbers, e.g. [x1, y1, x2, y2, x3, y3...].
 */
export const getContourPathCoords = (contour: cv.Mat): Point[] => {
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
  // Take the smaller of both sides, to allow for wide aspect ratio sources.
  const minArea = Math.min(container.rows, container.cols) ** 2 * MIN_SQUARE_AREA;
  const sizeLimit = Math.max(container.rows, container.cols) * MAX_SQUARE_SIZE;
  const sides = contour.size().height;

  // TODO: Tweak min-area threshold so that the 'design-3.jpg' test passes.
  if (sides === 4 && cv.contourArea(contour) >= minArea) {
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
  const [sourceWidth, sourceHeight] = [src.cols, src.rows];

  // Find the corners of the contour (this won't work if the grid is too close to 45°).
  const contourCoords = getContourPathCoords(rectangleContour);
  const topLeft = closest([0, 0], contourCoords);
  const topRight = closest([sourceWidth, 0], contourCoords);
  const bottomLeft = closest([0, sourceHeight], contourCoords);
  const bottomRight = closest([sourceWidth, sourceHeight], contourCoords);

  // Choose the smallest width and side, for the cropped dimensions.
  const newWidth = Math.min(topRight[0] - topLeft[0], bottomRight[0] - bottomLeft[0]);
  const newHeight = Math.min(bottomLeft[1] - topLeft[1], bottomRight[1] - topRight[1]);
  const flattened = cv.Mat.zeros(newWidth, newHeight, cv.CV_8UC3);
  const size = new cv.Size(newWidth, newHeight);

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
    newWidth,
    0,
    newWidth,
    newHeight,
    0,
    newHeight,
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

  // @ts-ignore -- TODO Add missing CV type definitions, to avoid @ts-ignores
  return mean.doubleAt(0, 0) >= CELL_EMPTY_THRESHOLD;
};

/**
 * Tesseract is notoriously bad at extracting text from table cells; so we need help it out, by
 * cropping the cell's contents to remove any edges (which can be mistaken for characters).
 *
 * @todo Move to SudokuScanner?
 */
export const cropCellBorders = (src: cv.Mat, binary: cv.Mat): cv.Mat | null => {
  const cellCenter = [Math.round(binary.rows / 2), Math.round(binary.cols / 2)] as Point;
  const cellArea = binary.rows * binary.cols;
  const minArea = MIN_CHAR_AREA * cellArea;
  const maxArea = MAX_CHAR_AREA * cellArea;
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
  hierarchy.delete();

  let largestArea = 0;
  let largestRect = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const area = rect.width * rect.height;
    const shapeRatio = rect.width / rect.height;

    if (
      area > minArea &&
      area < maxArea &&
      shapeRatio > MIN_CHAR_ASPECT_RATIO &&
      shapeRatio < MAX_CHAR_ASPECT_RATIO &&
      isPointInsideRect(cellCenter, rect) &&
      area > largestArea
    ) {
      largestArea = area;
      largestRect = rect;
    }
    contour.delete();
  }

  if (largestRect !== null) {
    // OCR really is expensive, so anything we can do before it to eliminate empty cells, generally
    // saves a lot of work.
    const binaryCellContents = binary.roi(largestRect);
    const isCellEmpty = isEmpty(binaryCellContents);
    binaryCellContents.delete();

    if (!isCellEmpty) {
      // Padding the contents helps OCR.
      const padding = Math.round(CHAR_PADDING * cellArea ** (1 / 2));

      // TODO: Explore "column walking" method, to identify true upper bounds
      //      (count at least ~5% black pixels in row, to disambiguate noise?)
      largestRect.x = Math.max(largestRect.x - padding, 0);
      largestRect.y = Math.max(largestRect.y - padding, 0);

      // TODO: Pad tall-thin characters' width a bit more?
      largestRect.width = Math.min(largestRect.width + 2 * padding, src.cols - largestRect.x);
      largestRect.height = Math.min(largestRect.height + 2 * padding, src.rows - largestRect.y);

      contours.delete();
      return src.roi(largestRect);
    }
  }
  contours.delete();
  return null;
};
