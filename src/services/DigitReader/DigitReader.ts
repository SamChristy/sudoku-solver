import isNode from 'detect-node';
import path from 'path';
import {
  createScheduler,
  createWorker,
  ImageLike,
  PSM,
  Scheduler,
  WorkerOptions,
  WorkerParams,
} from 'tesseract.js';

import DigitReaderInterface from '../../types/interfaces/DigitReader';

export default class DigitReader implements DigitReaderInterface {
  protected readonly scheduler: Scheduler;
  protected readonly language = 'eng';
  protected readonly workerConfig: Partial<WorkerOptions>;
  protected readonly tesseractConfig: Partial<WorkerParams> = {
    tessedit_ocr_engine_mode: 2,
    tessedit_pageseg_mode: '10' as PSM,
    tessedit_char_whitelist: '0123456789',
    user_defined_dpi: '300',
  };

  constructor(config?: Partial<WorkerParams>) {
    // Configure Tesseract worker to not make external download requests...
    this.workerConfig = isNode
      ? {
          langPath: path.join(__dirname, '..', '..', '..', 'public', '/ocr'),
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
    this.tesseractConfig = { ...this.tesseractConfig, ...config };
    this.scheduler = createScheduler();
  }

  /** @inheritDoc */
  public async load(): Promise<void> {
    const addThread = async () => {
      const worker = createWorker(this.workerConfig);

      await worker.load();
      await worker.loadLanguage(this.language);
      await worker.initialize(this.language);
      await worker.setParameters(this.tesseractConfig);

      this.scheduler.addWorker(worker);
    };

    // TODO: Compare multi-core performance in different browsers/devices.
    const coreCount = 2; // navigator.hardwareConcurrency / 2;
    await Promise.allSettled(Array(coreCount).fill(0).map(addThread));
  }

  /** @inheritDoc */
  public async extractSingle(imageSource: ImageLike): Promise<number | null> {
    // TODO: Check other returned symbols and use Sudoku constraints to inform selection.
    const { data } = await this.scheduler.addJob('recognize', imageSource);
    const digitChart = data.text.slice(0, 1); // Tesseract sometimes returns multiple chars!

    return digitChart ? +digitChart : null;
  }

  /** @inheritDoc */
  public async destruct() {
    console.log('Reader.destruct()', this);
    // await this.scheduler.terminate();
  }
}
