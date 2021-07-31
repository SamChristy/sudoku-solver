interface Resolution {
  width: number;
  height: number;
}

/**
 * Used for getting the best-possible camera and configuration from `MediaDevices.getUserMedia()`.
 */
const idealCameraConstraints = {
  width: { ideal: 4096 },
  height: { ideal: 2160 },
  facingMode: { ideal: 'environment' },
  focusMode: { ideal: 'continuous' },
  whiteBalance: { ideal: 'continuous' },
  exposureMode: { ideal: 'continuous' },
};

/**
 * Attempts to find the device's main, telephoto, back-facing camera.
 */
export const identifyPrimaryCamera = async (): Promise<MediaDeviceInfo | null> => {
  const inputDevices = await navigator.mediaDevices.enumerateDevices();
  const cameras = inputDevices.filter(device => device.kind === 'videoinput');

  if (!cameras.length) throw new Error('No camera found.');

  const backFacingCameras = cameras.filter(camera => camera.label.includes('facing back'));

  // For some reason, on phones with multiple cameras, the last one is usually the main one...
  return backFacingCameras.length ? backFacingCameras[backFacingCameras.length - 1] : null;
};

/**
 *  Loads video stream into the supplied <video /> element.
 */
export const turnOnCamera = async (videoElement: HTMLVideoElement, dimensions?: Resolution) => {
  const camera = await identifyPrimaryCamera();
  const constraints = {
    video: {
      ...idealCameraConstraints,
      // Fall back to the OS-selected camera, if our heuristic can't choose one.
      deviceId: camera?.deviceId ? camera.deviceId : undefined,
      ...(dimensions && {
        width: { ideal: dimensions.width },
        height: { ideal: dimensions.height },
      }),
    },
    audio: false,
  };

  videoElement.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
  await videoElement.play();
};

export const getFrame = (video: HTMLVideoElement): ImageData | null => {
  const buffer = document.createElement('canvas');
  buffer.width = video.videoWidth;
  buffer.height = video.videoHeight;
  const ctx = buffer.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0);
  return ctx.getImageData(0, 0, buffer.width, buffer.height);
};

/**
 * Ends any streams associated with the <video />, so that the user's camera light turns off.
 */
export const turnOffCamera = (videoElement: HTMLVideoElement) => {
  const stream = videoElement.srcObject as MediaStream;
  stream.getVideoTracks()[0].stop();
};
