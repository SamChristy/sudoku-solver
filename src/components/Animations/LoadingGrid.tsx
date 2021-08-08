import styles from './LoadingGrid.module.scss';

export default function LoadingGrid() {
  return (
    <div className={styles.loadingGrid}>
      <span className={styles.block1} />
      <span className={styles.block2} />
      <span className={styles.block3} />
      <span className={styles.block4} />
      <span className={styles.block5} />
      <span className={styles.block6} />
      <span className={styles.block7} />
      <span className={styles.block8} />
      <span className={styles.block9} />
    </div>
  );
}
