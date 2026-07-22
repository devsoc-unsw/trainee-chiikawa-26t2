import styles from "./landing.module.css"
import { useState } from "react"
export default function Landing() {
  const [clicked, setClicked] = useState(false);

  return <div>
    <img src="/learnternBackground.png" className={styles.background}></img>
    <div className={!clicked ? styles.darkness : `${styles.darkness} ${styles.panIn}`}></div>
    <div className={styles.main}>
      <div className={styles.titleWrapper}>
        <div className={!clicked ? styles.candleLight : `${styles.candleLight} ${styles.out}`}>
          <div className={!clicked ? styles.candle : `${styles.candle} ${styles.blowOut}`}></div>
        </div>
        <div className={styles.title}>earntern</div>
      </div>
      <div className={styles.bio}> Illuminate your learning. </div>
      <div className={styles.startButton} onClick={() => setClicked(true)}></div>
    </div>

  </div>
}