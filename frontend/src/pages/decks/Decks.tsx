import { redirect, useLoaderData, useNavigate } from "react-router";
import { authClient } from "../../lib/auth";
import React, { Fragment } from "react";
import styles from "./decks.module.css";

export async function decksLoader() {
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

type ReviewedTone = "fresh" | "warm" | "stale";

interface LanternItem {
  id: string;
  code: string;
  cards: number;
  reviewed: string;
  tone: ReviewedTone;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "/pixelatedlantern.png", path: "/decks", active: true },
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

const LANTERNS: LanternItem[] = [
  { id: "comp3311", code: "COMP3311", cards: 40, reviewed: "Reviewed just now", tone: "fresh", icon: "/Blazing.png" },
  { id: "eng2400", code: "ENG2400", cards: 30, reviewed: "Reviewed 1h ago", tone: "fresh", icon: "/Blazing.png" },
  { id: "comp3231", code: "COMP3231", cards: 28, reviewed: "Reviewed 4h ago", tone: "fresh", icon: "/LowFire.png" },
  { id: "math1131", code: "MATH1131", cards: 25, reviewed: "Reviewed 1d ago", tone: "warm", icon: "/LowFire.png" },
  { id: "phys1211", code: "PHYS1211", cards: 18, reviewed: "Reviewed 2d ago", tone: "warm", icon: "/LowFire.png" },
  { id: "chem1011", code: "CHEM1011", cards: 15, reviewed: "Reviewed 4d ago", tone: "warm", icon: "/LowFire.png" },
  { id: "math1081", code: "MATH1081", cards: 22, reviewed: "Reviewed 6d ago", tone: "warm", icon: "/LowFire.png" },
  { id: "biol1101", code: "BIOL1101", cards: 12, reviewed: "Reviewed 1w ago", tone: "stale", icon: "/Flickering.png" },
  { id: "comp1521", code: "COMP1521", cards: 16, reviewed: "Reviewed 2w ago", tone: "stale", icon: "/deadlantern.png" },
  { id: "hist1101", code: "HIST1101", cards: 9, reviewed: "Reviewed 3w ago", tone: "stale", icon: "/deadlantern.png" },
];

const TOTAL_LANTERNS = 24;

const BRIGHTNESS_GUIDE = ["/deadlantern.png", "/Flickering.png", "/LowFire.png", "/Blazing.png"];

const USER: UserInfo = {
  name: "John Doe",
  avatar: "/defaultProfile.png",
  level: 1,
  xp: 350,
  xpMax: 490,
};

const DAILY_STREAK_DAYS = 14;

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

function LanternCard({ code, cards, reviewed, tone, icon }: LanternItem) {
  return (
    <div className={styles.lanternCard}>
      <img className={styles.frameImg} src="/mainFrame3.png" alt="" aria-hidden="true" />
      <img className={styles.lanternCardIcon} src={icon} alt="" />
      <div className={styles.lanternCardCode}>{code}</div>
      <div className={styles.lanternCardMeta}>{cards} cards</div>
      <div className={`${styles.lanternCardReviewed} ${styles[tone]}`}>{reviewed}</div>
    </div>
  );
}

export default function Decks() {
  const { user }: { user: AuthUser } = useLoaderData();
  const navigate = useNavigate();

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
              All the lanterns you've created. Brightness reflects how recently you reviewed.
            </p>

            <div className={styles.summaryRow}>
              <div className={styles.totalLanterns}>
                <div className={styles.totalLabel}>Total Lanterns</div>
                <div className={styles.totalValueRow}>
                  <span className={styles.totalValue}>{TOTAL_LANTERNS}</span>
                  <img className={styles.totalIcon} src="/pixelatedlantern.png" alt="" />
                </div>
              </div>

              <div className={styles.brightnessGuide}>
                <span className={styles.guideLabel}>New</span>
                {BRIGHTNESS_GUIDE.map((icon, index) => (
                  <Fragment key={icon}>
                    <img
                      className={styles.guideIcon}
                      style={{ width: 14 + index * 5, height: 14 + index * 5 }}
                      src={icon}
                      alt=""
                    />
                    {index < BRIGHTNESS_GUIDE.length - 1 && <span className={styles.guideDash}>—</span>}
                  </Fragment>
                ))}
                <span className={styles.guideLabel}>Reviewed recently</span>
              </div>
            </div>

            <div className={styles.lanternGrid}>
              {LANTERNS.map((lantern) => (
                <LanternCard key={lantern.id} {...lantern} />
              ))}

              <button className={styles.createCard} type="button">
                <span className={styles.createPlus}>+</span>
                <span>Create new lantern</span>
              </button>
            </div>

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