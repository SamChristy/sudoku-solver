import styles from './Overlay.module.scss';

export default function Overlay({ corners }: { corners: boolean }) {
  return (
    <div className={styles.overlay} role="application">
      {corners && (
        <>
          <div className={`${styles.corner} ${styles.top} ${styles.left}`} />
          <div className={`${styles.corner} ${styles.top} ${styles.right}`} />
          <div className={`${styles.corner} ${styles.bottom} ${styles.left}`} />
          <div className={`${styles.corner} ${styles.bottom} ${styles.right}`} />
        </>
      )}
    </div>
  );
}
