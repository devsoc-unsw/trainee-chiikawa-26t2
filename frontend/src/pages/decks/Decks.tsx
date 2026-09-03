import { redirect, useLoaderData, useNavigate } from "react-router";
import { authClient } from "../../lib/auth";
import React from "react";
import styles from "./decks.module.css";
import { listMyDecks, type Deck } from "../../lib/api";
import { useMusic } from "../../lib/MusicProvider";

export async function decksLoader() {
  const session = await authClient.getSession();

  if (!session?.data?.user) {
    return redirect("/login");
  }

  try {
    const decks = await listMyDecks();
    return { user: session.data.user, decks, decksError: false };
  } catch (e) {
    console.error("Could not load your lanterns:", e);
    return { user: session.data.user, decks: [] as Deck[], decksError: true };
  }
}

interface AuthUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  level?: number;
  xp?: number;
  xpMax?: number;
  cardsReviewed?: number;
  daysPassed?: number;
  refinedLanterns?: number;
  lanternsBuilt?: number;
  dailyStreak?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  active?: boolean;
  lanternColour?: LanternColour;
}

type ReviewedTone = "fresh" | "warm" | "stale";

type LanternColour = "orange" | "green" | "yellow" | "red" | "black" | "gold";

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Updated ${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `Updated ${weeks}w ago`;
}

function toneFor(date: string): ReviewedTone {
  const hours = (Date.now() - new Date(date).getTime()) / 3_600_000;
  if (hours < 24) return "fresh";
  if (hours < 24 * 7) return "warm";
  return "stale";
}

function lanternColourForTone(tone: ReviewedTone): LanternColour {
  if (tone === "fresh") return "green";
  if (tone === "warm") return "yellow";
  return "red";
}

interface AnimatedLanternProps {
  colour?: LanternColour;
  className?: string;
}

interface GuideItem {
  id: string;
  lanternColour: LanternColour;
}

function AnimatedLantern({
  colour = "orange",
  className = "",
}: AnimatedLanternProps) {
  return (
    <span
      className={`${styles.animatedLantern} ${
        styles[`lantern${colour.charAt(0).toUpperCase()}${colour.slice(1)}`]
      } ${className}`}
      aria-hidden="true"
    />
  );
}

interface AnimatedFireProps { className?: string; } 
function AnimatedFire({ className = "" }: AnimatedFireProps) { 
  return ( <span className={`${styles.animatedFire} ${className}`} aria-hidden="true" /> ); 
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "lantern", path: "/decks", active: true, lanternColour: "orange"},
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

const GUIDE: GuideItem[] = [
  { id: "Dead", lanternColour: "black"},
  { id: "Flickering", lanternColour: "red"},
  { id: "Low Fire", lanternColour: "yellow"},
  { id: "Blazing", lanternColour: "green"}
]

interface PanelProps {
  frame: string;
  className?: string;
  children: React.ReactNode;
}

function Panel({ frame, className = "", children }: PanelProps) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <img className={styles.frameImg} src={frame} alt="" aria-hidden="true" />
      {children}
    </div>
  );
}

function LanternCard({ deck, onClick }: { deck: Deck; onClick: () => void }) {
  const tone = toneFor(deck.updatedAt);
  const lanternColour = lanternColourForTone(tone);
  return (
    <button className={styles.lanternCard} type="button" onClick={onClick}>
      <img className={styles.frameImg} src="/mainFrame3.png" alt="" aria-hidden="true" />
      <AnimatedLantern colour={lanternColour} className={styles.lanternCardIcon} />
      <div className={styles.lanternCardCode}>{deck.title}</div>
      <div className={styles.lanternCardMeta}>{deck.cardCount} card{deck.cardCount === 1 ? "" : "s"}</div>
      <div className={`${styles.lanternCardReviewed} ${styles[tone]}`}>{timeAgo(deck.updatedAt)}</div>
    </button>
  );
}

export default function Decks() {
  const { user, decks, decksError }: { user: AuthUser; decks: Deck[]; decksError: boolean } = useLoaderData();
  const navigate = useNavigate();
  const { toggleMusic, isPlaying } = useMusic();

  const dailyStreakDays = user.dailyStreak ?? 0;

  return (
    <div className={styles.lanternsRoot}>
      <img className={styles.bgImage} src="/beach-background.png" alt="" aria-hidden="true" />
      <div className={styles.app}>


        <div
          onClick={toggleMusic}
          className={
            isPlaying
              ? styles.soundButton
              : `${styles.soundButton} ${styles.muted}`
          }
        />


        {/* LOGO */}
        <div className={styles.logo}>
          <img className={styles.logoIcon} src="/candleL.png" alt="" />
          <span className={styles.logoText}>earntern</span>
        </div>

        <Panel frame="/navBarFrame.png" className={styles.sidebarNav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                >
                  {item.icon === "lantern" ? (
                    <AnimatedLantern colour={item.lanternColour} className={styles.navIcon} />
                  ) : (
                    <img className={styles.navIcon} src={item.icon} alt="" />
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* MAIN CONTENT */}
        <Panel frame="/deckFrame.png" className={styles.mainPanel}>
          <div className={styles.panelInner}>

            <div className={styles.headerRow}>
              <button
                className={styles.backBtn}
                type="button"
                aria-label="Go back"
                onClick={() => navigate(-1)}
              >
                ←
              </button>
              <h2 className={styles.panelTitle}>My Lanterns</h2>

              <div className={styles.headerActions}>
                <div className={styles.searchBox}>
                  <input className={styles.searchInput} type="text" placeholder="Search lanterns..." />
                  <span className={styles.searchIcon} aria-hidden="true">🔍</span>
                </div>
                <button className={styles.pillBtn} type="button">
                  <span aria-hidden="true">▾</span> Filter
                </button>
                <button className={styles.pillBtn} type="button">
                  Sort <span aria-hidden="true">⇅</span>
                </button>
              </div>
            </div>

            <p className={styles.subtitle}>
              {decksError
                ? "Couldn't load your lanterns right now - try refreshing the page."
                : decks.length === 0
                  ? "You haven't created any lanterns yet - light your first one below."
                  : "All the lanterns you've created. Brightness reflects how recently each one was updated."}
            </p>

            <div className={styles.summaryRow}>
              <div className={styles.totalLanterns}>
                <div className={styles.totalLabel}>Total Lanterns</div>
                <div className={styles.totalValueRow}>
                  <span className={styles.totalValue}>{decks.length}</span>
                  <img className={styles.totalIcon} src="/pixelatedlantern.png" alt="" />
                </div>
              </div>

              <div className={styles.brightnessGuide}>
                <span className={styles.guideLabel}>Needs review</span>
                {GUIDE.map((item) => (
                  <AnimatedLantern key={item.id} colour={item.lanternColour} className={styles.navIcon} />
                ))}
                <span className={styles.guideLabel}>Reviewed recently</span>
              </div>
            </div>

            <div className={styles.lanternGrid}>
              {decks.map((deck) => (
                <LanternCard key={deck._id} deck={deck} onClick={() => navigate(`/decks/${deck._id}`)} />
              ))}

              <button
                className={styles.createCard}
                type="button"
                onClick={() => navigate("/decks/new")}
              >
                <span className={styles.createPlus}>+</span>
                <span>Create new lantern</span>
              </button>
            </div>

          </div>
        </Panel>

        <Panel frame="/streakFrame.png" className={styles.dailyStreak}>
          <div className={styles.dailyStreakInner}>
            <AnimatedFire className={styles.streakPillIcon} />

            <div className={styles.dailyStreakLabel}>Daily Streak:</div>
            <div className={styles.dailyStreakValue}>
              {dailyStreakDays} <span className={styles.dailyStreakValueUnit}>days</span>
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
}