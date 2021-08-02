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

import TextReaderInterface, { TextReaderConfig } from '../../types/interfaces/TextReader';

export default class TextReader implements TextReaderInterface {
  protected readonly scheduler: Scheduler;
  protected readonly language = 'eng';
  protected readonly config: TextReaderConfig = {
    /** 2 threads seems a good compromise on mobile devices */
    threadCount: 2, // TODO: Dynamically determine optimal thread count.
    whiteList: '',
    single: false,
  };

  constructor(config?: Partial<TextReaderConfig>) {
    this.config = { ...this.config, ...config };
    this.scheduler = createScheduler();
  }

  /** @inheritDoc */
  public async load(): Promise<void> {
    const { workerConfig, tesseractConfig } = this.getTesseractConfig();
    const addThread = async () => {
      const worker = createWorker(workerConfig);

      await worker.load();
      await worker.loadLanguage(this.language);
      await worker.initialize(this.language);
      await worker.setParameters(tesseractConfig);

      this.scheduler.addWorker(worker);
    };

    await Promise.allSettled(Array(this.config.threadCount).fill(0).map(addThread));
  }

  /** @inheritDoc */
  public async read(imageSource: ImageLike): Promise<string> {
    const { data } = await this.scheduler.addJob('recognize', imageSource);

    // Precaution, as Tesseract sometimes returns multiple chars!
    return this.config.single ? data.text.slice(0, 1) : data.text;
  }

  /** @inheritDoc */
  public async destruct() {
    await this.scheduler.terminate();
  }

  /**
   * "Translates" our configuration into Tesseract's.
   */
  protected getTesseractConfig = () => {
    const tesseractConfig: Partial<WorkerParams> = {
      tessedit_ocr_engine_mode: 2,
      user_defined_dpi: '300',
      tessedit_pageseg_mode: '10' as PSM,
      tessedit_char_whitelist: '123456789',
    };

    // Configure Tesseract worker to not make external download requests...
    const workerConfig: Partial<WorkerOptions> = isNode
      ? {
          langPath: path.join(__dirname, '..', '..', '..', 'public', 'ocr'),
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

    return { tesseractConfig, workerConfig };
  };
}
