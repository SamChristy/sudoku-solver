// eslint-disable-next-line import/prefer-default-export
export const imgFromCanvas = (canvas: HTMLCanvasElement): HTMLImageElement => {
  const img = document.createElement('img');
  img.src = canvas.toDataURL();

  return img;
};
