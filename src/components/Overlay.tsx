import styles from './Overlay.module.scss';

export default function Overlay() {
  return (
    <div className={styles.overlay} role="application">
      <div className={`${styles.blurBox} ${styles.top}`} />
      <div className={`${styles.blurBox} ${styles.right}`} />
      <div className={`${styles.blurBox} ${styles.bottom}`} />
      <div className={`${styles.blurBox} ${styles.left}`} />
    </div>
  );
}
