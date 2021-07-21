import { createWorker, ImageLike, PSM, Worker, WorkerParams } from 'tesseract.js';

import DigitExtractorInterface from '../../types/interfaces/DigitExtractor';

export default class DigitExtractor implements DigitExtractorInterface {
  protected readonly worker: Worker;
  protected readonly language = 'eng';
  protected readonly tesseractConfig: Partial<WorkerParams> = {
    tessedit_ocr_engine_mode: 2,
    tessedit_pageseg_mode: '10' as PSM,
    tessedit_char_whitelist: '0123456789',
    user_defined_dpi: '300',
  };

  constructor(config?: Partial<WorkerParams>) {
    this.worker = createWorker();
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
