import { ImageLike } from 'tesseract.js';

export type TextReaderConfig = {
  threadCount: number;
  whitelist: string;
  single: boolean;
};

export default interface TextReader {
  /**
   * Loads dependencies, so the instance is ready to use.
   */
  load(): Promise<void>;

  /**
   * Extracts text from an image.
   */
  read(imageSource: ImageLike): Promise<string>;

  /**
   * Cleans up allocated resources.
   */
  destruct(): Promise<void>;
}
