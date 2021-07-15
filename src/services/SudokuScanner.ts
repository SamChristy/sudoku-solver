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
  protected readonly preprocessParams = {
    blurRadius: 11,
    thresholdBlur: 5,
    thresholdNorm: 2,
  };

  protected readonly rows: number;
  protected readonly columns: number;
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
  } | null;

  /**
   * Loads the image to be scanned.
   */
  constructor(source: HTMLCanvasElement | ImageData, rows = 9, columns = 9) {
    if (!cv) throw new Error('opencv.js must be loaded!');

    this.original =
      source.constructor.name === 'ImageData' ? cv.matFromImageData(source) : cv.imread(source);
    this.source = this.original.clone();
    this.rows = rows;
    this.columns = columns;
  }

  /**
   * Extracts the largest Sudoku from the source image, returning a boolean and, optionally, loading
   * it into the
   */
  public extractSudokuImage(outputCanvas?: HTMLCanvasElement) {
    // TODO: Check if image is too blurry.
    this.preprocessImage({ blurRadius: 11, thresholdBlur: 5, thresholdNorm: 2 });
    const largestSquare = this.findLargestSquare();

    if (largestSquare !== null) {
      this.processed = {
        colour: cropAndFlatten(this.original, largestSquare),
        binary: cropAndFlatten(this.source, largestSquare),
      };

      largestSquare.delete();
      this.original.delete();
      this.source.delete();

      outputCanvas && cv.imshow(outputCanvas, this.processed.colour);
      return true;
    }

    return false;
  }

  /**
   * Extracts digits from the source image.
   */
  public extractDigits(): (HTMLCanvasElement | null)[] | null {
    const grid = Array(this.rows).fill(Array(this.columns).fill(null));

    // If we haven't scanned the image for Sudokus yet, we need to...
    this.processed === undefined && this.extractSudokuImage();
    // If we didn't find a Sudoku, then we won't find any digits...
    if (!this.processed) return null;

    const originalCells = split(this.processed.colour as cv.Mat, this.rows, this.columns);
    const binaryCells = split(this.processed.binary as cv.Mat, this.rows, this.columns);

    for (let r = 0; r < this.rows; r++) {
      const row = Array(this.columns);

      for (let c = 0; c < this.columns; c++) {
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
   *
   * @param blurRadius
   * @param thresholdBlur
   * @param thresholdNorm
   */
  protected preprocessImage({ blurRadius, thresholdBlur, thresholdNorm }: ImageAnalysisParams) {
    // Grayscale, to help line-identification.
    cv.cvtColor(this.source, this.source, cv.COLOR_RGBA2GRAY, 0);
    // Blur, to smooth out noise.
    const blurKernel = new cv.Size(blurRadius, blurRadius);
    cv.GaussianBlur(this.source, this.source, blurKernel, 0, 0, cv.BORDER_DEFAULT);
    // Convert to black & white.
    cv.adaptiveThreshold(
      this.source,
      this.source,
      255, // black
      cv.ADAPTIVE_THRESH_MEAN_C,
      cv.THRESH_BINARY,
      thresholdBlur,
      thresholdNorm
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

type ImageAnalysisParams = { blurRadius: number; thresholdBlur: number; thresholdNorm: number };
