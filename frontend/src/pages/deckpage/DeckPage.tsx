import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate, useRevalidator, type LoaderFunctionArgs } from "react-router";
import { authClient } from "../../lib/auth";
import dashboardStyles from "./Dashboard.module.css";
import styles from "./DeckPage.module.css";
import {
  getDeck,
  getDeckPreviewCards,
  getScheduledCards,
  getAllDeckCardsForReview,
  submitReview,
  getLanternTier,
  LANTERN_TIERS,
  REVIEW_MODES,
  RATING,
  type Deck,
  type Card,
  type CardWithState,
  type ScheduledCardsResponse,
  type ReviewMode,
  type RatingValue,
  type LanternTier,
} from "../../lib/api";
import { StatCard } from "../dashboard/Dashboard";

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  name: string;
  image?: string | null;
  level?: number;
  xp?: number;
  xpMax?: number;
}

interface DeckPageLoaderData {
  deck: (Deck & { isCreator: boolean }) | null;
  user: AuthUser | null;
  previewCards: Card[];
  scheduled: ScheduledCardsResponse | null;
  allCards: CardWithState[] | null;
  err: boolean;
}

export async function deckPageLoader({ params }: LoaderFunctionArgs): Promise<DeckPageLoaderData> {
  const deckId = params.deckId!;
  const session = await authClient.getSession();
  const user = (session?.data?.user as AuthUser | undefined) ?? null;

  try {
    const deck = await getDeck(deckId);
    const previewCards = await getDeckPreviewCards(deckId);

    if (!user) {
      return { deck, user: null, previewCards, scheduled: null, allCards: null, err: false };
    }

    const [scheduled, allCards] = await Promise.all([
      getScheduledCards(deckId),
      getAllDeckCardsForReview(deckId),
    ]);

    return { deck, user, previewCards, scheduled, allCards, err: false };
  } catch (e) {
    console.error("Could not load this deck:", e);
    return { deck: null, user, previewCards: [], scheduled: null, allCards: null, err: true };
  }
}

// ──────────────────────────────────────────────────────────────
// Small shared pieces (duplicated from Dashboard.tsx for now —
// worth extracting into components/ once a third page needs them)
// ──────────────────────────────────────────────────────────────

type LanternColour = "orange" | "green" | "yellow" | "red" | "black" | "gold";

function AnimatedLantern({ colour = "orange", className = "" }: { colour?: LanternColour; className?: string }) {
  return (
    <span
      className={`${dashboardStyles.animatedLantern} ${dashboardStyles[`lantern${colour.charAt(0).toUpperCase()}${colour.slice(1)}`]
        } ${className}`}
      aria-hidden="true"
    />
  );
}

function Panel({ frame, className = "", children }: { frame: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`${dashboardStyles.panel} ${className}`}>
      <img className={dashboardStyles.frameImg} src={frame} alt="" aria-hidden="true" />
      {children}
    </div>
  );
}

function FrameButton({
  frame,
  className = "",
  children,
  ...props
}: { frame: string; className?: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${styles.frameButton} ${className}`} type="button" {...props}>
      {/* <img className={styles.frameImg} src={frame} alt="" aria-hidden="true" /> */}
      <span className={styles.frameButtonLabel}>{children}</span>
    </button>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "lantern", active: true, path: "/decks" },
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

const LANTERN_COLOUR_BY_TIER: Record<LanternTier, LanternColour> = {
  [LANTERN_TIERS.BLAZING_BRIGHT]: "green",
  [LANTERN_TIERS.LOW_FIRE]: "yellow",
  [LANTERN_TIERS.FLICKERING]: "red",
  [LANTERN_TIERS.BROKEN]: "black",
};

const LANTERN_LABEL_CLASS_BY_TIER: Record<LanternTier, string> = {
  [LANTERN_TIERS.BLAZING_BRIGHT]: dashboardStyles.labelBlazing,
  [LANTERN_TIERS.LOW_FIRE]: dashboardStyles.labelLow,
  [LANTERN_TIERS.FLICKERING]: dashboardStyles.labelFlickering,
  [LANTERN_TIERS.BROKEN]: dashboardStyles.labelBroken,
};

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

type PageMode = "preview" | ReviewMode;

interface SessionScore {
  correct: number;
  total: number;
}

export default function DeckPage() {
  const { deck, user, previewCards, scheduled, allCards, err } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const [mode, setMode] = useState<PageMode>("preview");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [queue, setQueue] = useState<CardWithState[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionScore, setSessionScore] = useState<SessionScore>({ correct: 0, total: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scheduledQueue = useMemo<CardWithState[]>(
    () => (scheduled ? [...scheduled.dueCards, ...scheduled.newCards] : []),
    [scheduled],
  );

  const sessionFinished = mode !== "preview" && queueIndex >= queue.length;

  const currentCard: Card | CardWithState | undefined =
    mode === "preview" ? previewCards[previewIndex] : sessionFinished ? undefined : queue[queueIndex];

  // Lantern breakdown for THIS deck — computed client-side from allCards, since
  // getDeckStats only returns FSRS state breakdown, not lantern tiers, and
  // getUserDashboardStats's breakdown is global rather than per-deck.
  const lanternCounts = useMemo(() => {
    const counts: Record<LanternTier, number> = {
      [LANTERN_TIERS.BLAZING_BRIGHT]: 0,
      [LANTERN_TIERS.LOW_FIRE]: 0,
      [LANTERN_TIERS.FLICKERING]: 0,
      [LANTERN_TIERS.BROKEN]: 0,
    };
    if (!allCards) return counts;
    for (const c of allCards) {
      if (!c.cardState) continue; // never-reviewed cards have no meaningful tier yet
      counts[getLanternTier(c.cardState.lanternStatus)]++;
    }
    return counts;
  }, [allCards]);

  function flip() {
    if (!currentCard || sessionFinished) return;
    setShowAnswer((s) => !s);
  }

  function goPrev() {
    setShowAnswer(false);
    setPreviewIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setShowAnswer(false);
    setPreviewIndex((i) => Math.min(previewCards.length - 1, i + 1));
  }

  function startScheduledReview() {
    if (scheduledQueue.length === 0) return;
    setMode(REVIEW_MODES.SCHEDULED);
    setQueue(scheduledQueue);
    setQueueIndex(0);
    setShowAnswer(false);
    setSessionScore({ correct: 0, total: 0 });
    setFeedbackMessage(null);
  }

  function startManualReview() {
    if (!allCards || allCards.length === 0) return;
    setMode(REVIEW_MODES.MANUAL);
    setQueue(allCards);
    setQueueIndex(0);
    setShowAnswer(false);
    setSessionScore({ correct: 0, total: 0 });
    setFeedbackMessage(null);
  }

  function exitReview() {
    setMode("preview");
    setQueue([]);
    setQueueIndex(0);
    setShowAnswer(false);
    setFeedbackMessage(null);
    revalidator.revalidate();
  }

  async function handleRate(rating: RatingValue) {
    if (!deck || !currentCard || isSubmitting || mode === "preview") return;
    setIsSubmitting(true);
    try {
      const result = await submitReview(deck._id, currentCard._id, rating, mode);
      setFeedbackMessage(result.isPreviewLike ? result.message : null);
      setSessionScore((s) => ({
        correct: s.correct + (rating >= RATING.GOOD ? 1 : 0),
        total: s.total + 1,
      }));
    } catch (e) {
      console.error("Failed to submit review:", e);
      setFeedbackMessage("Something went wrong submitting that review.");
    } finally {
      setIsSubmitting(false);
      setShowAnswer(false);
      setQueueIndex((i) => i + 1);
    }
  }

  // Space to flip, arrow keys to browse in preview mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (mode === "preview") {
        if (e.code === "ArrowLeft") goPrev();
        if (e.code === "ArrowRight") goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentCard, sessionFinished, previewIndex, previewCards.length]);

  if (err || !deck) {
    return (
      <div className={dashboardStyles.dashboardRoot}>
        <div className={styles.centerNote}>Could not load this deck. It may be private or no longer exist.</div>
      </div>
    );
  }

  const modeLabel =
    mode === "preview" ? "PREVIEW" : mode === REVIEW_MODES.SCHEDULED ? "SCHEDULED REVIEW" : "MANUAL REVIEW";

  return (
    <div className={dashboardStyles.dashboardRoot}>
      <img className={dashboardStyles.bgImage} src="/beach-background.png" alt="" aria-hidden="true" />
      <div className={styles.app}>
        {/* Logo */}
        <div className={dashboardStyles.logo}>
          <img className={dashboardStyles.logoIcon} src="/candleL.png" alt="" />
          <span className={dashboardStyles.logoText}>earntern</span>
        </div>

        {/* Title bar */}
        <div className={styles.titleBar}>
          {deck.title}
          <span className={styles.titleMode}>({modeLabel})</span>
        </div>

        {/* Profile / login prompt */}
        {user ? (
          <Panel frame="/profileFrame.png" className={dashboardStyles.profileCard}>
            <div className={dashboardStyles.profileCardInner}>
              <img className={dashboardStyles.avatar} src={user.image || "/defaultProfile.png"} alt={`${user.name} avatar`} />
              <div className={dashboardStyles.profileCardInfo}>
                <div className={dashboardStyles.profileCardName}>{user.name}</div>
                <div className={dashboardStyles.profileCardLevel}>Level {user.level ?? 1}</div>
                <div className={dashboardStyles.profileCardXp}>
                  {user.xp ?? 0}/{user.xpMax ?? 100} XP
                </div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel frame="/profileFrame.png" className={dashboardStyles.profileCard}>
            <div className={dashboardStyles.profileCardInner}>
              <div className={dashboardStyles.profileCardInfo}>
                <div className={dashboardStyles.profileCardName}>Browsing as a guest</div>
              </div>
              <FrameButton frame="/buttonFrame.png" onClick={() => navigate("/login")}>
                Log&nbsp;in
              </FrameButton>
            </div>
          </Panel>
        )}

        {/* Sidebar nav */}
        <Panel frame="/navBarFrame.png" className={dashboardStyles.sidebarNav}>
          <ul className={dashboardStyles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`${dashboardStyles.navItem} ${item.active ? dashboardStyles.navItemActive : ""}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                >
                  {item.icon === "lantern" ? (
                    <AnimatedLantern className={dashboardStyles.navIcon} />
                  ) : (
                    <img className={dashboardStyles.navIcon} src={item.icon} alt="" />
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Flashcard area */}
        <main className={styles.flashcardArea}>
          {sessionFinished ? (
            <div className={styles.cardFrame}>
              <div className={styles.sessionComplete}>
                <div className={styles.sessionCompleteTitle}>Session complete!</div>
                {mode === REVIEW_MODES.MANUAL && (
                  <div className={styles.sessionCompleteScore}>
                    You scored {sessionScore.correct}/{sessionScore.total}
                  </div>
                )}
                <FrameButton frame="/buttonFrame.png" onClick={exitReview}>
                  Back to preview
                </FrameButton>
              </div>
            </div>
          ) : currentCard ? (
            <div className={styles.cardFrame} onClick={flip}>
              <img className={styles.cardBg} src="/card.png" alt="" aria-hidden="true" />
              <div className={styles.cardContent}>
                <div className={styles.cardFrontText}>{currentCard.front}</div>
                {showAnswer && (
                  <>
                    <hr />
                    <div className={styles.cardBackText}>{currentCard.back}</div>
                  </>
                )}
                {!showAnswer && <div className={styles.cardHint}>Click or press space to reveal</div>}
              </div>
            </div>
          ) : (
            <Panel frame="/mainFrame.png" className={styles.cardFrame}>
              <div className={styles.centerNote}>This deck has no cards yet.</div>
            </Panel>
          )}

          {/* Rating buttons (review) or back/forward (preview) */}
          {!sessionFinished && currentCard && (
            <div className={styles.actionRow}>
              {mode === "preview" ? (
                <>
                  <FrameButton frame="/buttonFrame.png" onClick={goPrev} disabled={previewIndex === 0}>
                    ◀&nbsp;Back
                  </FrameButton>
                  <FrameButton
                    frame="/buttonFrame.png"
                    onClick={goNext}
                    disabled={previewIndex >= previewCards.length - 1}
                  >
                    Next&nbsp;▶
                  </FrameButton>
                </>
              ) : showAnswer ? (
                <>
                  <FrameButton frame="/buttonFrame.png" onClick={() => handleRate(RATING.AGAIN)} disabled={isSubmitting}>
                    Again
                  </FrameButton>
                  <FrameButton frame="/buttonFrame.png" onClick={() => handleRate(RATING.HARD)} disabled={isSubmitting}>
                    Hard
                  </FrameButton>
                  <FrameButton frame="/buttonFrame.png" onClick={() => handleRate(RATING.GOOD)} disabled={isSubmitting}>
                    Good
                  </FrameButton>
                  <FrameButton frame="/buttonFrame.png" onClick={() => handleRate(RATING.EASY)} disabled={isSubmitting}>
                    Easy
                  </FrameButton>
                </>
              ) : null}
            </div>
          )}
        </main>

        {/* Fire status (deck-specific lantern breakdown) */}
        <Panel frame="/navBarFrame.png" className={`${dashboardStyles.sidebarNav} ${dashboardStyles.rightColumn}`}>
          <div className={dashboardStyles.panelInner}>
            <h2 className={dashboardStyles.panelTitle}>Fire status</h2>
            {user ? (
              <div className={styles.fireStatusList}>
                <div className={styles.statGrid}>
                  <StatCard icon="lantern" value={lanternCounts[LANTERN_TIERS.BLAZING_BRIGHT] || 0} label="Blazing Bright" labelClassName={styles.labelBlazing} lanternColour="green" />
                  <StatCard icon="lantern" value={lanternCounts[LANTERN_TIERS.LOW_FIRE] || 0} label="Low Fire" labelClassName={styles.labelLow} lanternColour="yellow" />

                </div>
                <div className={styles.statGrid}>
                  <StatCard icon="lantern" value={lanternCounts[LANTERN_TIERS.FLICKERING] || 0} label="Flickering" labelClassName={styles.labelFlickering} lanternColour="red" />
                  <StatCard icon="lantern" value={lanternCounts[LANTERN_TIERS.BROKEN] || 0} label="Broken Lanterns" labelClassName={styles.labelBroken} lanternColour="black" />
                </div>
              </div>
            ) : (
              <div className={styles.lockedPanel}>Log in to track this deck's fire status.</div>
            )}
          </div>
        </Panel>

        {/* Mode row: start-review buttons, or active-session info + exit */}
          {mode === "preview" ? (
            user ? (
              <div className={styles.modeRow}>
                <FrameButton frame="/buttonFrame.png" onClick={startScheduledReview} disabled={scheduledQueue.length === 0}>
                  Review Scheduled ({scheduledQueue.length} cards)
                </FrameButton>
                <FrameButton frame="/buttonFrame.png" onClick={startManualReview} disabled={!allCards || allCards.length === 0}>
                  Manual Review All ({allCards?.length ?? 0} cards)
                </FrameButton>
              </div>
            ) : (
              <div className={styles.modeRowExtra}>
                <div className={styles.modeInfoPill}>Log in to start a review session</div>
              </div>
            )
          ) : (
            <div className={styles.modeRowExtra}>
              <div className={styles.modeInfoPill}>
                {mode === REVIEW_MODES.SCHEDULED ? "Reviewing Scheduled Cards" : "Manual Review"} (
                {queue.length} cards)
                {mode === REVIEW_MODES.MANUAL && (
                  <span className={styles.scoreText}>
                    {" "}
                    · Score: {sessionScore.correct}/{sessionScore.total}
                  </span>
                )}
              </div>
              <FrameButton frame="/buttonFrame.png" onClick={exitReview}>
                Exit Review
              </FrameButton>
          </div>
          )}
        {feedbackMessage && <div className={styles.feedbackText}>{feedbackMessage}</div>}
      </div>
    </div>
  );
}