// if (!document.getElementsByTagName('tr').length)
//   frameRef.current = requestAnimationFrame(() => processStream(input, output));
// else {
//   const worker = createWorker();
//
//   (async () => {
//     await worker.load();
//     await worker.loadLanguage('eng');
//     await worker.initialize('eng');
//     await worker.setParameters({
//       // @ts-ignore
//       tessedit_ocr_engine_mode: 2,
//       // @ts-ignore
//       tessedit_pageseg_mode: '10',
//       tessedit_char_whitelist: '0123456789',
//       user_defined_dpi: '300',
//     });
//     Array.from(document.querySelectorAll('img')).reduce(async (previousPromise, img, i) => {
//       await previousPromise;
//
//       return worker.recognize(img).then(({ data }) => {
//         console.warn(data);
//         const b = document.createElement('b');
//         b.textContent = data.text.slice(0, 1); // Tesseract sometimes returns multiple chars!
//         img.parentNode?.append(b, `(${Math.round(data.confidence)})`);
//       });
//     }, Promise.resolve());
//   })();
// }

export default class DigitExtractor {
  // constructor() {}
}
