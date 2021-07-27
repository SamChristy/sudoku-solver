import isNode from 'detect-node';
import path from 'path';
import { createWorker, ImageLike, PSM, Worker, WorkerOptions, WorkerParams } from 'tesseract.js';

import DigitReaderInterface from '../../types/interfaces/DigitReader';

export default class DigitReader implements DigitReaderInterface {
  protected readonly worker: Worker;
  protected readonly language = 'eng';
  protected readonly tesseractConfig: Partial<WorkerParams> = {
    tessedit_ocr_engine_mode: 2,
    tessedit_pageseg_mode: '10' as PSM,
    tessedit_char_whitelist: '0123456789',
    user_defined_dpi: '300',
  };

  constructor(config?: Partial<WorkerParams>) {
    // Configure Tesseract worker to not make external download requests...
    const workerConfig: Partial<WorkerOptions> = isNode
      ? {
          langPath: path.join(__dirname, '..', '..', '..', `public/ocr`),
          // It should be faster to cache the uncompressed lang data, although there seems to be no
          // real difference in practice; so we may as well keep the repo smaller.
          cacheMethod: 'none',
          gzip: true,
        }
      : {
          langPath: `${process.env.PUBLIC_URL}/ocr`,
          workerPath: `${process.env.PUBLIC_URL}/ocr/worker.min.js`,
          corePath: `${process.env.PUBLIC_URL}/ocr/tesseract-core.wasm.js`,
        };
    this.worker = createWorker(workerConfig);
    this.tesseractConfig = { ...this.tesseractConfig, ...config };
  }

  /** @inheritDoc */
  public async load() {
    await this.worker.load();
    await this.worker.loadLanguage(this.language);
    await this.worker.initialize(this.language);
    await this.worker.setParameters(this.tesseractConfig);
  }

  /** @inheritDoc */
  public async extractSingle(imageSource: ImageLike): Promise<string> {
    // TODO: Check other returned symbols and use Sudoku constraints to inform selection.
    const { data } = await this.worker.recognize(imageSource);

    return data.text.slice(0, 1); // Tesseract sometimes returns multiple chars!
  }

  /** @inheritDoc */
  public async destruct() {
    this.worker.terminate();
  }
}
