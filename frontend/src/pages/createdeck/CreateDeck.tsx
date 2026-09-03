import { redirect, useNavigate, useLoaderData } from "react-router";
import React, { useState } from "react";
import { authClient } from "../../lib/auth";
import { createDeck, addCard, ApiError } from "../../lib/api";
import styles from "./createdeck.module.css";

export async function createDeckLoader() {
  const session = await authClient.getSession();

  if (!session?.data?.user) {
    return redirect("/login");
  }

  return { user: session.data.user };
}

interface AuthUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  active?: boolean;
}

interface UserInfo {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpMax: number;
}

interface DraftCard {
  id: string;
  front: string;
  back: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "/pixelatedlantern.png", path: "/decks", active: true },
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

const USER: UserInfo = {
  name: "John Doe",
  avatar: "/defaultProfile.png",
  level: 1,
  xp: 350,
  xpMax: 490,
};

const DAILY_STREAK_DAYS = 14;

function makeId() {
  return Math.random().toString(36).slice(2);
}

function emptyCard(): DraftCard {
  return { id: makeId(), front: "", back: "" };
}

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

export default function CreateDeck() {
  const { user }: { user: AuthUser } = useLoaderData();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<DraftCard[]>([emptyCard()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addCardRow = () => {
    setCards((prev) => [...prev, emptyCard()]);
  };

  const removeCardRow = (id: string) => {
    setCards((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give your lantern a name before lighting it.");
      return;
    }

    const cardsToCreate = cards
      .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
      .filter((c) => c.front && c.back);

    setSubmitting(true);
    try {
      // POST /api/decks
      const deck = await createDeck({
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      // POST /api/decks/:deckId/cards for each filled-in card
      for (const card of cardsToCreate) {
        await addCard(deck._id, card);
      }

      navigate(`/decks/${deck._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the lantern. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.lanternsRoot}>
      <img className={styles.bgImage} src="/beach-background.png" alt="" aria-hidden="true" />

      <div className={styles.app}>

        {/* LOGO */}
        <div className={styles.logo}>
          <img className={styles.logoIcon} src="/candleL.png" alt="" />
          <span className={styles.logoText}>earntern</span>
        </div>

        {/* PROFILE CARD */}
        <Panel frame="/profileFrame.png" className={styles.profileCard}>
          <div className={styles.profileCardInner}>
            <img className={styles.avatar} src={USER.avatar} alt={`${USER.name} avatar`} />
            <div className={styles.profileCardInfo}>
              <div className={styles.profileCardName}>{USER.name}</div>
              <div className={styles.profileCardLevel}>Level {USER.level}</div>
              <div className={styles.profileCardXp}>{USER.xp}/{USER.xpMax} XP</div>
            </div>
            <button className={styles.iconBtn} aria-label="Settings" onClick={() => navigate("/settings")}>
              <img src="/cogwheel.png" alt="" />
            </button>
          </div>
        </Panel>

        <Panel frame="/navBarFrame.png" className={styles.sidebarNav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                >
                  <img className={styles.navIcon} src={item.icon} alt="" />
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
              <h2 className={styles.panelTitle}>Create New Lantern</h2>
            </div>

            <p className={styles.subtitle}>
              Name your lantern, describe what it's for, and add a few cards to get it started.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && <div className={styles.errorBanner}>{error}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="deck-title">Title</label>
                <input
                  id="deck-title"
                  className={styles.formInput}
                  type="text"
                  placeholder="e.g. COMP3311"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="deck-description">Description</label>
                <textarea
                  id="deck-description"
                  className={styles.formTextarea}
                  placeholder="What is this lantern about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <label className={styles.checkboxRow} htmlFor="deck-public">
                <input
                  id="deck-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>Make this lantern public</span>
              </label>

              <div className={styles.cardsSection}>
                <div className={styles.cardsSectionHeader}>
                  <h3 className={styles.cardsSectionTitle}>Cards</h3>
                  <span className={styles.cardsSectionHint}>Optional — you can add more later</span>
                </div>

                {cards.map((card, index) => (
                  <div className={styles.cardRow} key={card.id}>
                    <span className={styles.cardRowIndex}>{index + 1}</span>
                    <div className={styles.cardRowInputs}>
                      <input
                        className={styles.cardInput}
                        type="text"
                        placeholder="Front"
                        value={card.front}
                        onChange={(e) => updateCard(card.id, "front", e.target.value)}
                        maxLength={1000}
                      />
                      <input
                        className={styles.cardInput}
                        type="text"
                        placeholder="Back"
                        value={card.back}
                        onChange={(e) => updateCard(card.id, "back", e.target.value)}
                        maxLength={1000}
                      />
                    </div>
                    <button
                      className={styles.removeCardBtn}
                      type="button"
                      aria-label="Remove card"
                      onClick={() => removeCardRow(card.id)}
                      disabled={cards.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button className={styles.addCardBtn} type="button" onClick={addCardRow}>
                  <span className={styles.createPlus}>+</span>
                  <span>Add another card</span>
                </button>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button className={styles.primaryBtn} type="submit" disabled={submitting}>
                  {submitting ? "Lighting..." : "Light the lantern"}
                </button>
              </div>
            </form>

          </div>
        </Panel>

        <Panel frame="/streakFrame.png" className={styles.dailyStreak}>
          <div className={styles.dailyStreakInner}>
            <img className={styles.dailyStreakIcon} src="/fire.png" alt="" />
            <div>
              <div className={styles.dailyStreakLabel}>Daily Streak</div>
              <div className={styles.dailyStreakValue}>
                {DAILY_STREAK_DAYS} <span className={styles.dailyStreakValueUnit}>days</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
