import { forwardRef, MutableRefObject, useEffect } from 'react';

import { loadCameraStream, turnOffCamera } from '../util/camera';

const CameraFeed = forwardRef<HTMLVideoElement, Props>(({ onLoad }: Props, ref) => {
  useEffect(() => {
    const { current } = ref as MutableRefObject<HTMLVideoElement | null>;
    if (!current) return () => {};

    loadCameraStream(current);
    return () => turnOffCamera(current);
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
