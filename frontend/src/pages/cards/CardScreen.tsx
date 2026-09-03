import { useState } from "react";
import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ApiError, getDeck, getDeckCards } from "../../api/decks";
import type { Card, Deck } from "../../api/decks";
import styles from "./cards.module.css";

export async function cardScreenLoader({ params }: LoaderFunctionArgs) {
  const deckId = params.deckId;
  if (!deckId) {
    throw new Response("Missing deck id", { status: 400 });
  }

  try {
    const [deck, cards] = await Promise.all([getDeck(deckId), getDeckCards(deckId)]);
    return { deck, cards };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return redirect("/login");
    }
    throw e;
  }
}

export default function CardScreen() {
  const { deck, cards }: { deck: Deck; cards: Card[] } = useLoaderData();
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const card = cards[index];
  const isFirst = index === 0;
  const isLast = index === cards.length - 1;
  const isEmpty = cards.length === 0;

  const goTo = (i: number) => {
    setIndex(i);
    setShowAnswer(false);
  };

  const reset = () => {
    goTo(0);
  };

  const prompt = isEmpty
    ? "this deck has no cards yet"
    : isLast && showAnswer
      ? "end of deck! hit reset to play again"
      : `card ${index + 1} of ${cards.length}. ${showAnswer ? "answer revealed" : "hit check answers to reveal"}`;

  return (
    <div className={styles.page}>
      <section className={styles.background}>
        <main className={styles.cardArea}>
          <header className={styles.header}>
            <div className={styles.titleBanner}>
              <span className={styles.title}>{deck.title}</span>
              <img src="/pixelatedlantern.png" alt="" className={styles.lantern} />
            </div>
          </header>

          <div className={styles.card}>
            <p className={styles.cardText}>
              {isEmpty ? "..." : showAnswer ? card.back : card.front}
            </p>
          </div>
        </main>

        <footer className={styles.controls}>
          <p className={styles.prompt}>{prompt}</p>

          <div className={styles.buttons}>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className={`${styles.button} ${styles.buttonSmall}`}
              disabled={isEmpty || isFirst}
            >
              <span className={styles.label}>PREV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className={styles.button}
              disabled={isEmpty || showAnswer}
            >
              <span className={styles.label}>CHECK ANSWERS</span>
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className={`${styles.button} ${styles.buttonSmall}`}
              disabled={isEmpty || isLast}
            >
              <span className={styles.label}>NEXT</span>
            </button>

            <button
              type="button"
              onClick={reset}
              className={`${styles.button} ${styles.buttonSmall}`}
              disabled={isEmpty || (isFirst && !showAnswer)}
            >
              <span className={styles.label}>RESET</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
