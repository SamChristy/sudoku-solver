import styles from './Ellipsis.module.scss';

export default function Ellipsis() {
  return (
    <span>
      <span className={styles.one}>.</span>
      <span className={styles.two}>.</span>
      <span className={styles.three}>.</span>
    </span>
  );
}
