import { forwardRef, MutableRefObject, useEffect } from 'react';

import { onBack, onTabChange } from '../util/browser';
import { loadCameraStream, turnOffCamera } from '../util/camera';

const CameraFeed = forwardRef<HTMLVideoElement, Props>(({ onLoad }: Props, ref) => {
  useEffect(() => {
    const { current } = ref as MutableRefObject<HTMLVideoElement | null>;
    if (!current) return () => {};

    // Pause the user's camera, when they're not actively using the app (to respect their device's
    // battery and stop the annoying "camera-in-use" icons/webcam lights).
    const listenerCleanups = [
      onTabChange({
        closed: () => turnOffCamera(current),
        opened: () => loadCameraStream(current),
      }),
      onBack(() => loadCameraStream(current)),
    ];

    loadCameraStream(current);

    return () => {
      turnOffCamera(current);
      listenerCleanups.forEach(cleanup => cleanup());
    };
  }, [ref]);

  return (
    <div>
      [CameraFeed]
      <video ref={ref} onLoadedMetadata={onLoad} muted playsInline />
    </div>
  );
});

type Props = { onLoad(): void };
export default CameraFeed;
