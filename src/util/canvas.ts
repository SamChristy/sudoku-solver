export const imgFromCanvas = (canvas: HTMLCanvasElement): HTMLImageElement => {
  const img = document.createElement('img');
  img.src = canvas.toDataURL();

  return img;
};

export const canvasToBuffer = (canvas: HTMLCanvasElement) =>
  Buffer.from(canvas.toDataURL().replace(/^data:image\/\w{1,9};base64,/, ''), 'base64');
