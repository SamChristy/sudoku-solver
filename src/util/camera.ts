const idealCameraConstraints = {
  width: { ideal: window.innerWidth },
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
 * Loads video stream into the supplied <video /> element.
 *
 * @param videoElement
 */
export const loadCameraStream = async (videoElement: HTMLVideoElement) => {
  const camera = await identifyPrimaryCamera();
  const constraints = {
    video: {
      ...idealCameraConstraints,
      // Fall back to the OS-selected camera, if our heuristic choose one.
      deviceId: camera?.deviceId ? camera.deviceId : undefined,
    },
    audio: false,
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();
};
