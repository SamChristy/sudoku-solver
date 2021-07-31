import isNode from 'detect-node';

import SudokuScannerInterface, {
  SudokuDigitImages,
  SudokuScannerConfig,
} from '../../types/interfaces/SudokuScanner';
import { loadScript } from '../../util/browser';
import {
  cropAndFlatten,
  cropCellBorders,
  isContourSquarish,
  simplifyContour,
  split,
} from '../lib/cv';

/**
 * Locates and extracts Sudoku puzzles from a supplied image.
 */
export default class SudokuScanner implements SudokuScannerInterface {
  /** @inheritDoc */
  protected readonly config: SudokuScannerConfig = {
    rows: 9,
    columns: 9,
    preprocess: {
      blurRadius: 11,
      thresholdBlur: 5,
      thresholdNorm: 2,
    },
    minSize: 0.25,
    maxSize: 0.99,
  };

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
   * Loads the image to be scanned and applies custom config values, if supplied.
   */
  constructor(source: HTMLCanvasElement | ImageData, config?: Partial<SudokuScannerConfig>) {
    if (!cv) throw new Error('OpenCV must be loaded!');

    this.original =
      source.constructor.name === 'ImageData' ? cv.matFromImageData(source) : cv.imread(source);
    this.source = this.original.clone();
    this.config = { ...this.config, ...config };
  }

  /** @inheritDoc */
  public extractSudokuImage(outputCanvas?: HTMLCanvasElement): boolean {
    // TODO: Check if image is too blurry (see: https://github.com/justadudewhohacks/opencv4nodejs/issues/448)
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

      outputCanvas && cv.imshow(outputCanvas, this.processed.colour);
      return true;
    }

    this.processed = null;
    return false;
  }

  /** @inheritDoc */
  public extractDigits(): SudokuDigitImages {
    console.log('extract digits 🔢');
    // If we didn't find a Sudoku, then we won't find any digits...
    if (this.processed === null) return null;

    // If we haven't scanned the image for Sudokus yet, we need to...
    if (this.processed === undefined) {
      this.extractSudokuImage();
      return this.extractDigits();
    }

    const originalCells = split(this.processed.colour, this.config.rows, this.config.columns);
    const binaryCells = split(this.processed.binary, this.config.rows, this.config.columns);
    const grid: (HTMLCanvasElement | null)[][] = [];

    for (let r = 0; r < this.config.rows; r++) {
      const row = [];

      for (let c = 0; c < this.config.columns; c++) {
        const colourCell = originalCells[r][c];
        const binaryCell = binaryCells[r][c];
        const digitMat = cropCellBorders(colourCell, binaryCell);

        if (digitMat) {
          const canvas = document.createElement('canvas');
          row.push(canvas);
          cv.imshow(canvas, digitMat);

          digitMat.delete();
        } else row.push(null);

        colourCell.delete();
        binaryCell.delete();
      }

      grid.push(row);
    }

    return grid;
  }

  /** @inheritDoc */
  public destruct(): void {
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
  protected preprocessImage(): void {
    const { blurRadius, thresholdBlur, thresholdNorm } = this.config.preprocess;

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

      // TODO: Add additional constraints, e.g.parallel Hough lines, to reduce false positives?
      if (isContourSquarish(simplified, this.source, this.config.minSize, this.config.maxSize)) {
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

  /**
   * Loads the Scanner's dependencies in a browser context (please note, this must be done manually
   * if using node). This must be have resolved before the class is used.
   *
   * @param timeLimit The time, in ms, after which an Error will be thrown, if the dependencies have
   *                  not loaded.
   */
  static async loadDependencies(timeLimit?: number): Promise<void> {
    if (isNode || typeof cv !== 'undefined') return Promise.resolve();

    return loadScript('opencv.js', timeLimit);
  }
}
