import { Form, redirect, useLoaderData } from "react-router";
import { authClient } from "../../lib/auth";
import React from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useMusic } from "../../lib/MusicProvider";
import { getDashboardStats, listFriends, listMyDecks, type DashboardStats, type FriendSummary } from "../../lib/api";
import { type Deck } from "../../lib/api";

export async function dashboardLoader() {
  const session = await authClient.getSession();

  if (!session?.data?.user) {
    return redirect("/login");
  }

  try {
    const [stats, friends, decks] = await Promise.all([getDashboardStats(), listFriends(), listMyDecks()]);
    return { user: session.data.user, stats, friends, decks, err: false };
  } catch (e) {
    console.error("Could not load your lanterns:", e);
    return { user: session.data.user, stats: null, friends: [] as FriendSummary[], err: true };
  }
}

//Add more colours
type LanternColour = "orange" | "green" | "yellow" | "red" | "black" | "gold";

interface AnimatedLanternProps {
  colour?: LanternColour;
  className?: string;
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

// Fields are left optional for now as old accounts will not have the new fields, remove all old accounts from db before changing
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
  active?: boolean;
}

interface StatItem {
  id: string;
  icon: string;
  value: string | number;
  label: string;
  labelClassName?: string;
  isCourse?: boolean;
  iconVariant?: "statCardIconLantern";
  lanternColour?: LanternColour;
}

interface DeckTask {
  deckId: string;
  title: string;
  meta: string;
  dueLabel: string;
  lanternColour: LanternColour;
  priority: number;
  sortKey: number;
}


function dueInfoForDeck(deck: DashboardStats["decks"][number]): Omit<DeckTask, "deckId" | "title"> {
  if (deck.dueToday > 0) {
    return {
      meta: `${deck.dueToday} card${deck.dueToday === 1 ? "" : "s"} due`,
      dueLabel: "Due now",
      lanternColour: "red",
      priority: 0,
      sortKey: -deck.dueToday,
    };
  }
  if (deck.newCards > 0) {
    return {
      meta: `${deck.newCards} new card${deck.newCards === 1 ? "" : "s"}`,
      dueLabel: "Ready to start",
      lanternColour: "yellow",
      priority: 1,
      sortKey: -deck.newCards,
    };
  }
  if (deck.nextDueAt) {
    const ms = new Date(deck.nextDueAt).getTime() - Date.now();
    const hours = ms / 3_600_000;
    const dueLabel =
      hours < 1 ? `Due in ${Math.max(1, Math.round(ms / 60000))}m`
      : hours < 24 ? `Due in ${Math.round(hours)}h`
      : `Due in ${Math.round(hours / 24)}d`;
    return {
      meta: `${deck.cardCount} card${deck.cardCount === 1 ? "" : "s"}`,
      dueLabel,
      lanternColour: "green",
      priority: 2,
      sortKey: ms,
    };
  }
  return {
    meta: `${deck.cardCount} card${deck.cardCount === 1 ? "" : "s"}`,
    dueLabel: "All caught up",
    lanternColour: "green",
    priority: 3,
    sortKey: 0,
  };
}

function buildUpcomingTasks(stats: DashboardStats | null): DeckTask[] {
  if (!stats) return [];
  return stats.decks
    .filter((deck) => deck.cardCount > 0)
    .map((deck) => ({ deckId: deck.deckId, title: deck.title, ...dueInfoForDeck(deck) }))
    .sort((a, b) => a.priority - b.priority || a.sortKey - b.sortKey)
    .slice(0, 4);
}

const NAV_ITEMS: (NavItem & { path: string })[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", active: true, path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "lantern", path: "/decks" },
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

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

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  labelClassName?: string;
  isCourse?: boolean;
  iconVariant?: "statCardIconLantern";
  lanternColour?: LanternColour;
}

export function StatCard({ icon, value, label, labelClassName, isCourse = false, iconVariant, lanternColour = "orange", }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <img className={styles.frameImg} src="/mainFrame3.png" alt="" aria-hidden="true" />
      <div className={styles.statCardIconSlot}>
        {icon === "lantern" ? (
          <AnimatedLantern
            colour={lanternColour}
            className={`${styles.statCardIcon} ${
              iconVariant ? styles[iconVariant] : ""
            }`}
          />
          ) : (
          <img
            className={`${styles.statCardIcon} ${
              iconVariant ? styles[iconVariant] : ""
            }`}
            src={icon}
            alt=""
          />
        )}
      </div>
      <div className={`${styles.statCardValue} ${isCourse ? styles.statCardValueCourse : ""}`}>
        {value}
      </div>
      <div className={`${styles.statCardLabel} ${labelClassName || ""}`}>{label}</div>
    </div>
  );
}

type ReviewedTone = "fresh" | "warm" | "stale";

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

export default function Dashboard() {
  const { user, stats, friends, decks, err }: {
    user: AuthUser;
    stats: DashboardStats | null;
    friends: FriendSummary[];
    decks: Deck[];
    err: boolean;
  } = useLoaderData();

  const navigate = useNavigate();
  const { setMusic } = useMusic();
  const { toggleMusic, isPlaying } = useMusic();

  useEffect(() => {
    setMusic("/learnternvibes.mp3");
  }, [setMusic]);

  const profile = {
    name: user.name || "Explorer",
    avatar: user.image || "/defaultProfile.png",
    level: user.level ?? 1,
    xp: user.xp ?? 0,
    xpMax: user.xpMax ?? 100,
  };

  const overviewStats: StatItem[] = [
    { id: "cards-reviewed", icon: "/notes.png", value: stats?.totalCardsReviewedAllTime ?? 0, label: "Cards Reviewed" },
    { id: "days-passed", icon: "/mountain.png", value: stats?.daysPassed ?? 0, label: "Days passed" },
    { id: "refined-lanterns", icon: "lantern", value: user.refinedLanterns ?? 0, label: "Refined Lanterns", lanternColour: "gold" },
    { id: "lanterns-built", icon: "lantern", value: user.lanternsBuilt ?? 0, label: "Lanterns Built" },
  ];

  const dailyStreakDays = stats?.reviewStreak ?? 0;
  const upcomingTasks = buildUpcomingTasks(stats);

   return (
    <div className={styles.dashboardRoot}>
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
                    <AnimatedLantern className={styles.navIcon} />
                  ) : (
                    <img className={styles.navIcon} src={item.icon} alt="" />
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/*  MAIN CONTENT */}
        <main className={styles.mainContent}>

          {/* Overview */}
          <Panel frame="/mainFrame.png">
            <div className={styles.panelInner}>
              <h2 className={styles.panelTitle}>Overview</h2>
              <div className={styles.statGrid}>
                {overviewStats.map(({ id, ...stat }) => (
                  <StatCard key={id} {...stat} />
                ))}
              </div>
            </div>
          </Panel>

          {/* Fire status */}
          <Panel frame="/mainFrame.png">
            <div className={styles.panelInner}>
              <h2 className={styles.panelTitle}>Fire status</h2>
              <div className={styles.statGrid}>
                 <StatCard icon="lantern" value={stats?.lanternBreakdown["Blazing Bright"] || 0} label="Blazing Bright" labelClassName={styles.labelBlazing} lanternColour="green" />
                 <StatCard icon="lantern" value={stats?.lanternBreakdown["Low Fire"] || 0} label="Low Fire" labelClassName={styles.labelLow} lanternColour="yellow" />
                 <StatCard icon="lantern" value={stats?.lanternBreakdown.Flickering || 0} label="Flickering" labelClassName={styles.labelFlickering} lanternColour="red" />
                 <StatCard icon="lantern" value={stats?.lanternBreakdown.Broken || 0} label="Dead" labelClassName={styles.labelBroken} lanternColour="black" />
              </div>
            </div>
          </Panel>

          {/* Recent lanterns */}
          <Panel frame="/mainFrame.png">
            <div className={styles.panelInner}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitle}>Recent lanterns</h2>
                <button className={styles.btnViewAll} type="button" onClick={() => navigate(`/decks`)}>
                  <img className={styles.frameImg} src="viewAll.png" alt="" aria-hidden="true" />
                  <span className={styles.btnViewAllLabel}>View all</span>
                </button>
              </div>
              <div className={styles.statGrid}>
                {decks.length === 0 ? (
                  <div className={styles.listCardMeta}>
                    No lanterns available
                  </div>
                ) : (
                  decks.map((deck) => (
                    <LanternCard key={deck._id} deck={deck} onClick={() => navigate(`/decks/${deck._id}`)} />
                  ))
                )}
              </div>
            </div>
          </Panel>

        </main>

        {/* RIGHT COLUMN */}
        <aside className={styles.rightColumn}>

          {/* PROFILE CARD */}
          <Panel frame="/profileFrame.png" className={styles.profileCard}>
            <div className={styles.profileCardInner}>
               <img className={styles.avatar} src={user.image || "/defaultProfile.png"} alt={`${profile.name} avatar`} />
              <div className={styles.profileCardInfo}>
                 <div className={styles.profileCardName}>{user.name || "Explorer"}</div>
                <div className={styles.profileCardLevel}>Level {stats?.level || 0}</div>
                <div className={styles.profileCardXp}>{stats?.totalXp || 0}/{stats?.requiredXp || 0} XP</div>
              </div>
              <button
                className={styles.iconBtn}
                aria-label="Logout"
                onClick={async () => {
                  await authClient.signOut();
                  navigate("/login");
                }}
              >
                <img src="/door.png" alt="" />
              </button>
            </div>
          </Panel>

          <Panel frame="friendsFrame.png">
            <div className={styles.panelInner}>
              <div className={styles.panelHeaderRow}>
                <h2 className={`${styles.panelTitle} ${styles.panelTitleCenter}`}>Friends</h2>
                <button className={styles.btnViewAll} type="button" onClick={() => navigate("/friends")}>
                  <img className={styles.frameImg} src="viewAll.png" alt="" aria-hidden="true" />
                  <span className={styles.btnViewAllLabel}>Add Friends</span>
                </button>
              </div>
              {friends.length === 0 ? (
                <div className={styles.listCardMeta}>
                  No friends yet... {" "}
                </div>
              ) : (
                <ul className={styles.listCards}>
                  {friends.slice(0, 3).map((friend) => (
                    <li key={friend.requestId} className={styles.listCard}>
                      <button
                        className={styles.listCardBtn}
                        onClick={() => navigate("/friends")}
                        type="button"
                      >
                        <img className={styles.frameImg} src="/profileFrame.png" alt="" aria-hidden="true" />
                        <img className={styles.listCardAvatar} src={friend.avatar} alt={`${friend.name} avatar`} />
                        <div className={styles.listCardInfo}>
                          <div className={styles.listCardName}>{friend.name}</div>
                          <div className={styles.listCardMeta}>{friend.cardsReviewedToday} cards reviewed today</div>
                        </div>
                        <div className={styles.streakPill}>
                          <span>{friend.reviewStreak}</span>
                          <AnimatedFire className={styles.streakPillIcon} />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel frame="/TasksFrame.png">
            <div className={styles.panelInner}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleCenter}`}>Upcoming Tasks</h2>
              {upcomingTasks.length === 0 ? (
                <div className={styles.listCardMeta}>
                  No lanterns need attention right now — nice work!
                </div>
              ) : (
                <ul className={styles.listCards}>
                  {upcomingTasks.map((task) => (
                    <li key={task.deckId} className={styles.listCard}>
                      <button
                        className={styles.listCardBtn}
                        onClick={() => navigate(`/decks/${task.deckId}`)}
                        type="button"
                      >
                        <img className={styles.frameImg} src="/TasksFrame2.png" alt="" aria-hidden="true" />
                        <AnimatedLantern
                          colour={task.lanternColour}
                          className={styles.listCardAvatar}
                        />
                        <div className={styles.listCardInfo}>
                          <div className={styles.listCardName}>{task.title}</div>
                          <div className={styles.listCardMeta}>{task.meta}</div>
                        </div>
                        <div className={styles.duePill}>{task.dueLabel}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

        </aside>

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
