import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type MusicContextType = {
  setMusic: (src: string) => void;
  toggleMusic: () => void;
  isPlaying: boolean;
};

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const fadeVolume = useCallback(
    (
      target: number,
      duration: number,
    ): Promise<void> => {
      return new Promise((resolve) => {
        const audio = audioRef.current;

        if (!audio) {
          resolve();
          return;
        }

        if (fadeRef.current !== null) {
          cancelAnimationFrame(fadeRef.current);
        }

        const startVolume = audio.volume;
        const startTime = performance.now();

        const animate = (time: number) => {
          const progress = Math.min(
            (time - startTime) / duration,
            1,
          );

          audio.volume =
            startVolume +
            (target - startVolume) * progress;

          if (progress < 1) {
            fadeRef.current =
              requestAnimationFrame(animate);
          } else {
            audio.volume = target;
            resolve();
          }
        };

        fadeRef.current =
          requestAnimationFrame(animate);
      });
    },
    [],
  );

  const setMusic = useCallback(
    async (src: string) => {
      const audio = audioRef.current;

      if (!audio) return;

      // Don't restart the same song
      if (audio.src.endsWith(src)) return;

      const wasPlaying = !audio.paused;

      console.log("Changing music:", src);
      console.log("Was playing:", wasPlaying);

      // Fade current music out
      if (wasPlaying) {
        await fadeVolume(0, 500);
      }

      // Change song
      audio.pause();
      audio.src = src;
      audio.load();

      // Start new song
      if (wasPlaying) {
        audio.volume = 0;

        try {
          await audio.play();

          setIsPlaying(true);

          console.log("New song started");

          // Fade new music in
          await fadeVolume(1, 500);
        } catch (error) {
          console.error(
            "Could not play new music:",
            error,
          );

          setIsPlaying(false);
        }
      }
    },
    [fadeVolume],
  );

  const toggleMusic = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audio.paused) {
      try {
        audio.volume = 0;

        await audio.play();

        setIsPlaying(true);

        await fadeVolume(1, 500);
      } catch (error) {
        console.error("Audio playback blocked:", error);
      }
    } else {
      await fadeVolume(0, 500);

      audio.pause();

      setIsPlaying(false);
    }
  }, [fadeVolume]);

  return (
    <MusicContext.Provider
      value={{
        setMusic,
        toggleMusic,
        isPlaying,
      }}
    >
      <audio
        ref={audioRef}
        src="/Learntern Theme.mp3"
        loop
      />

      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error(
      "useMusic must be used inside MusicProvider",
    );
  }

  return context;
}