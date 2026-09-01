import { useState } from "react";
import styles from "./cards.module.css";

const DECK_TITLE = "Interesting Deck";
const QUESTION = "very interesting question";
const ANSWER = "very interesting answer";

export default function CardScreen() {
  const [showAnswer, setShowAnswer] = useState(false);

  const ShowAnswer = () => {
    setShowAnswer(true);
  };

  const Reset = () => {
    setShowAnswer(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.background}>
        <main className={styles.cardArea}>
          <header className={styles.header}>
            <div className={styles.titleBanner}>
              <span className={styles.title}>{DECK_TITLE}</span>
              <img src="/pixelatedlantern.png" alt="" className={styles.lantern} />
            </div>
          </header>

          <div className={styles.card}>
            <p className={styles.cardText}>{showAnswer ? ANSWER : QUESTION}</p>
          </div>
        </main>

        <footer className={styles.controls}>
          <p className={styles.prompt}>
            {showAnswer ? "answer revealed" : "hit check answers to reveal"}
          </p>

          <div className={styles.buttons}>
            <button
              type="button"
              onClick={ShowAnswer}
              className={styles.button}
              disabled={showAnswer}
            >
              <span className={styles.label}>CHECK ANSWERS</span>
            </button>

            <button
              type="button"
              onClick={Reset}
              className={`${styles.button} ${styles.buttonSmall}`}
            >
              <span className={styles.label}>RESET</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
