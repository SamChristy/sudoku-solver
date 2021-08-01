export interface SudokuScannerConfig {
  rows: number;
  columns: number;
  /** Parameters used for image thresholding {@link https://docs.opencv.org/master/d7/dd0/tutorial_js_thresholding.html} */
  preprocess: {
    blurRadius: number;
    thresholdBlur: number;
    thresholdNorm: number;
  };
  /** The smallest size of sudoku (as a proportion of the source image). */
  minSize: number;
  /** The largest size of sudoku (as a proportion of the source image). */
  maxSize: number;
}

export type SudokuDigitImages = (HTMLCanvasElement | null)[][];

export default interface SudokuScanner {
  /**
   * Extracts the largest Sudoku from the source image, returning a boolean and, optionally, loading
   * it into the provided canvas element.
   */
  extractSudokuImage(outputCanvas?: HTMLCanvasElement): boolean;

  /**
   * Extracts digits from the source image (ideal for OCR).
   */
  extractDigits(): SudokuDigitImages | null;

  /**
   * Releases resources that were assigned by the scanner - it's vital to call this, to avoid memory
   * leaks! 😬
   */
  destruct(): void;
}
