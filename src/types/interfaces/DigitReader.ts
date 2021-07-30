import { ImageLike } from 'tesseract.js';

export default interface DigitReader {
  /**
   * Loads dependencies, so the extractor is ready for use.
   */
  load(): Promise<void>;

  /**
   * Extracts a digit from a single source image.
   */
  extractSingle(imageSource: ImageLike): Promise<number | null>;

  /**
   * Processes an array of source images, extracting a single digit from each one (or empty string
   * if no digit can be found).
   */
  extractMultiple(imageSource: ImageLike[]): Promise<(number | null)[]>;

  /**
   * Cleans up resources allocated by the extractor.
   */
  destruct(): Promise<void>;
}
