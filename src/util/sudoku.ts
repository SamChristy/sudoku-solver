import { imgFromCanvas } from './canvas';
import { cropAndFlatten, cropCellBorders, isContourSquarish, simplifyContour, split } from './cv';

const ROWS = 9;
const COLUMNS = 9;
const BLUR_RADIUS = 11;
const LINE_COLOUR = 255;
const THRESHOLD_BLUR_RADIUS = 5;
const THRESHOLD_NORM = 2;

export const extractSudoku = (src: cv.Mat): cv.Mat => {
  const original = src.clone();

  // Grayscale, to help line-identification.
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  // Blur, to smooth out noise.
  const blurKernel = new cv.Size(BLUR_RADIUS, BLUR_RADIUS);
  cv.GaussianBlur(src, src, blurKernel, 0, 0, cv.BORDER_DEFAULT);
  // Convert to black & white (as close to "line art" as possible).
  cv.adaptiveThreshold(
    src,
    src,
    LINE_COLOUR,
    cv.ADAPTIVE_THRESH_MEAN_C,
    cv.THRESH_BINARY,
    THRESHOLD_BLUR_RADIUS,
    THRESHOLD_NORM
  );

  const binary = src.clone();

  // Find the largest squares in the image and try to work out whether or not they're sudokus,
  // choosing the most suitable candidate.
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const green = new cv.Scalar(0, 255, 0);
  const debugImage = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

  cv.findContours(src, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  let largestArea = 0;
  let largestSquare = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const simplified = simplifyContour(contour);

    // TODO: Add additional constraints (e.g.parallel Hough lines?) to filter out false positives! 🧐
    if (isContourSquarish(simplified, src)) {
      const area = cv.contourArea(simplified);
      if (area > largestArea) {
        largestArea = area;
        largestSquare = simplified.clone();
      }

      cv.drawContours(debugImage, contours, i, green, 1, cv.LINE_AA, hierarchy);
    }

    contour.delete();
    simplified.delete();
  }

  contours.delete();
  hierarchy.delete();

  if (largestSquare !== null) {
    const croppedOriginal = cropAndFlatten(original, largestSquare);
    const croppedBinary = cropAndFlatten(binary, largestSquare);
    const originalCells = split(croppedOriginal, ROWS, COLUMNS);
    const binaryCells = split(croppedBinary, ROWS, COLUMNS);
    const table = document.getElementById('grid1') as HTMLTableElement;

    table.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
      const tableRow = table.insertRow();

      for (let c = 0; c < COLUMNS; c++) {
        const originalCell = originalCells[r][c];
        const binaryCell = binaryCells[r][c];
        const cell = tableRow.insertCell();
        const canvas = document.createElement('canvas');
        const cropped = cropCellBorders(originalCell, binaryCell);

        if (cropped !== null) {
          cv.imshow(canvas, cropped);
          cell.append(imgFromCanvas(canvas));
        }

        originalCell.delete();
        binaryCell.delete();
      }
    }

    binary.delete();
    croppedBinary.delete();
    debugImage.delete();
    original.delete();
    largestSquare?.delete();

    return croppedOriginal;
  }

  original.delete();

  return debugImage;
};

export const solveSudoku = (sudoku: number[][]) => {};
