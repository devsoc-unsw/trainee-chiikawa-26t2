import styles from "./cards.module.css";

export default function CardScreen() {
  const ShowAnswer = () => {
    // Show Answer
  };

  const Reset = () => {
    // Reset to Question
  }

  return (
    <div className={styles.page}>
      <section className={styles.background}>
        <span className={styles.frameLabel}>BACKGROUND</span>

        <header className={styles.header}>
          <div className={`${styles.titleBanner} ${styles.box}`}>DECK TITLE</div>
          <div className={`${styles.lantern} ${styles.box}`}>LANTERN</div>
        </header>

        <div className={`${styles.card} ${styles.box}`}>
          <div className={`${styles.cardText} ${styles.boxHollow}`}>QUESTION / ANSWER TEXT</div>
        </div>

        <footer className={styles.controls}>
          <div onClick={ShowAnswer} className={`${styles.button} ${styles.box}`}>CHECK ANSWERS</div>
          <div onClick={Reset} className={`${styles.button} ${styles.box}`}>RESET</div>
        </footer>
      </section>
    </div>
  );
}
