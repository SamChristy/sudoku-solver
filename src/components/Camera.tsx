import { forwardRef, MutableRefObject, useEffect } from 'react';

import { turnOffCamera, turnOnCamera } from '../util/camera';
import styles from './Camera.module.scss';

export enum CameraStatus {
  Loading,
  Active,
  Denied,
  Unavailable,
}

/**
 * Renders a video feed of the user's camera (if one is available, with permission granted).
 */
const Camera = forwardRef<HTMLVideoElement, Props>(({ onStatusUpdate }: Props, ref) => {
  useEffect(() => {
    const { current } = ref as MutableRefObject<HTMLVideoElement | null>;

    if (!current) return () => {};

    turnOnCamera(current).catch(({ name }) =>
      onStatusUpdate(name === 'NotAllowedError' ? CameraStatus.Denied : CameraStatus.Unavailable)
    );

    return () => turnOffCamera(current);
  }, [onStatusUpdate, ref]);

  return (
    <video
      className={styles.camera}
      ref={ref}
      onLoadedMetadata={() => onStatusUpdate(CameraStatus.Active)}
      onSuspend={() => onStatusUpdate(CameraStatus.Unavailable)}
      playsInline
      muted
    />
  );
});

type Props = { onStatusUpdate(status: CameraStatus): void };
export default Camera;
