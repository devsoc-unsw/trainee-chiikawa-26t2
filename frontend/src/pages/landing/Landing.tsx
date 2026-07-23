import styles from "./landing.module.css"
import { useRef, useState } from "react"

export default function Landing() {

  const [clicked, setClicked] = useState(false);
  const [mute, setMute] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  function toggleMute() {
    if (!audioRef.current) return;

    if (mute) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
    setMute(!mute);
  }

  return <div>
    <audio ref={audioRef} src="/Learntern Theme.mp3" loop />
    <img src="/learnternBackground.png" className={styles.background}></img>
    <div className={!clicked ? styles.darkness : `${styles.darkness} ${styles.panIn}`}></div>
    <div onClick={toggleMute} className={!mute ? styles.soundButton : `${styles.soundButton} ${styles.muted}`}></div>
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