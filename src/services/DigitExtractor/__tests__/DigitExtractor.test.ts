import DigitExtractor from '../DigitExtractor';

it('loads without crashing', () => {
  const extractor = new DigitExtractor();
  extractor.load();
});
