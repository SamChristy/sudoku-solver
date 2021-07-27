import { ImageLike } from 'tesseract.js';

export default interface DigitReader {
  /**
   * Loads dependencies, so the extractor is ready for use.
   */
  load(): Promise<void>;

  /**
   * Extracts a digit from a single source image.
   */
  extractSingle(imageSource: ImageLike): Promise<string>;

  /**
   * Cleans up resources allocated by the extractor.
   */
  destruct(): Promise<void>;
}
