import {
  cropAndFlatten,
  cropCellBorders,
  isContourSquarish,
  simplifyContour,
  split,
} from '../util/cv';

/**
 * Locates and extracts Sudoku puzzles from a supplied image.
 */
export default class SudokuScanner {
  protected readonly ROWS: number;
  protected readonly COLUMNS: number;

  // Config values to adjust for image analysis:
  protected readonly BLUR_RADIUS = 11;
  protected readonly LINE_COLOUR = 255;
  protected readonly THRESHOLD_BLUR_RADIUS = 5;
  protected readonly THRESHOLD_NORM = 2;

  /** The original, unmodified copy we will keep; so that we can later return a clean image. */
  protected original: cv.Mat;
  /** The source image, which will be modified for image analysis.  */
  protected source: cv.Mat;
  /** The processed versions of the image (undefined, if scan() hasn't been called yet).  */
  protected processed?: {
    /** A cropped version of the original image (useful for rendering in a UI). */
    colour: cv.Mat;
    /** A black & white copy, to avoid having to redo the image processing in subsequent stages. */
    binary: cv.Mat;
  };

  /**
   * Loads the image to be scanned.
   */
  constructor(source: HTMLCanvasElement | ImageData, rows = 9, columns = 9) {
    if (!cv) throw new Error('opencv.js must be loaded!');

    this.original =
      source.constructor.name === 'ImageData' ? cv.matFromImageData(source) : cv.imread(source);
    this.source = this.original.clone();
    this.ROWS = rows;
    this.COLUMNS = columns;
  }

  /**
   * Extracts and returns the largest Sudoku from the source image or null, if no Sudoku can be be
   * found.
   */
  public extractSudokuImage(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
    this.preprocessImage();
    const largestSquare = this.findLargestSquare();

    if (largestSquare !== null) {
      this.processed = {
        colour: cropAndFlatten(this.original, largestSquare),
        binary: cropAndFlatten(this.source, largestSquare),
      };

      largestSquare.delete();
      this.original.delete();
      this.source.delete();

      const output = document.createElement('canvas');
      cv.imshow(canvas, this.processed.colour);
      return output;
    }

    return null;
  }

  /**
   * Extracts the digits from the processed Sudoku image (scan() must have been called first).
   */
  public extractDigits(): (HTMLCanvasElement | null)[] {
    if (!this.processed) throw new Error('.scan() must have been called before .extractDigits().');

    const originalCells = split(this.processed.colour, this.ROWS, this.COLUMNS);
    const binaryCells = split(this.processed.binary, this.ROWS, this.COLUMNS);
    const grid = Array(this.ROWS);

    for (let r = 0; r < this.ROWS; r++) {
      const row = Array(this.COLUMNS);

      for (let c = 0; c < this.COLUMNS; c++) {
        const colourCell = originalCells[r][c];
        const binaryCell = binaryCells[r][c];
        row[c] = cropCellBorders(colourCell, binaryCell);

        colourCell.delete();
        binaryCell.delete();
      }

      grid[r] = row;
    }

    return grid;
  }

  /**
   * Really important to call this when finished, as OpenCV will leak memory otherwise!
   */
  public destruct() {
    // If the image has been processed, then the this.original and this.source matrices have already
    // been deleted.
    if (this.processed) {
      this.processed.colour.delete();
      this.processed.binary.delete();
    } else {
      this.original.delete();
      this.source.delete();
    }
  }

  /**
   * Applies image thresholding, to make the source image as close to black & white "line art" as
   * possible (i.e. with the goal of finding contiguous lines, with minimal noise).
   */
  protected preprocessImage() {
    // Grayscale, to help line-identification.
    cv.cvtColor(this.source, this.source, cv.COLOR_RGBA2GRAY, 0);
    // Blur, to smooth out noise.
    const blurKernel = new cv.Size(this.BLUR_RADIUS, this.BLUR_RADIUS);
    cv.GaussianBlur(this.source, this.source, blurKernel, 0, 0, cv.BORDER_DEFAULT);
    // Convert to black & white.
    cv.adaptiveThreshold(
      this.source,
      this.source,
      this.LINE_COLOUR,
      cv.ADAPTIVE_THRESH_MEAN_C,
      cv.THRESH_BINARY,
      this.THRESHOLD_BLUR_RADIUS,
      this.THRESHOLD_NORM
    );
  }

  /**
   * Finds the contour (shape, in OpenCV) surrounding the largest Sudoku-like square in the source
   * image.
   */
  protected findLargestSquare(): cv.Mat | null {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.findContours(this.source, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let largestArea = 0;
    let largestSquare = null;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const simplified = simplifyContour(contour);

      // TODO: Add additional constraints (e.g.parallel Hough lines?) to reduce false positives! 🧐
      if (isContourSquarish(simplified, this.source)) {
        const area = cv.contourArea(simplified);
        if (area > largestArea) {
          largestArea = area;
          largestSquare = simplified.clone();
        }
      }
      contour.delete();
      simplified.delete();
    }

    contours.delete();
    hierarchy.delete();

    return largestSquare;
  }
}
