import { forwardRef, MutableRefObject, useEffect } from 'react';

import { onBack, onTabChange } from '../util/browser';
import { loadCameraStream, turnOffCamera } from '../util/camera';

export enum CameraStatus {
  Loading,
  Active,
  Unavailable,
}

/**
 * Renders a video feed of the user's camera (if one is available, with permission granted).
 */
const CameraFeed = forwardRef<HTMLVideoElement, Props>(({ onStatusUpdate }: Props, ref) => {
  useEffect(() => {
    const { current } = ref as MutableRefObject<HTMLVideoElement | null>;
    if (!current) return () => {};

    loadCameraStream(current).catch(() => {
      onStatusUpdate(CameraStatus.Unavailable);
      return () => {};
    });

    // Pause the user's camera, when they're not actively using the app (to respect their device's
    // battery and stop the annoying "camera-in-use" icons/webcam lights).
    const listenerCleanups = [
      onTabChange({
        closed: () => turnOffCamera(current),
        opened: () => loadCameraStream(current),
      }),
      onBack(() => loadCameraStream(current)),
    ];

    return () => {
      turnOffCamera(current);
      listenerCleanups.forEach(cleanup => cleanup());
    };
  }, [onStatusUpdate, ref]);

  return (
    <div>
      [CameraFeed]
      <video
        ref={ref}
        onLoadedMetadata={() => onStatusUpdate(CameraStatus.Active)}
        playsInline
        muted
      />
    </div>
  );
});

type Props = { onStatusUpdate(status: CameraStatus): void };
export default CameraFeed;
