import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.name}>James Reviews Music</span>
      <span className={styles.meta}>With love from Dublin ☘️</span>
    </footer>
  );
}
