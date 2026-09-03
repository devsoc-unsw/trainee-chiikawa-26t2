import { Form, redirect, useLoaderData } from "react-router";
import { authClient } from "../../lib/auth";
import React from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useMusic } from "../../lib/MusicProvider";

export async function dashboardLoader() {
  const session = await authClient.getSession();

  if (!session?.data?.user) {
    return redirect("/login");
  }

  return { user: session.data.user };
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

interface FriendItem {
  id: string;
  name: string;
  avatar: string;
  meta: string;
  streak: number;
}

interface TaskItem {
  id: string;
  title: string;
  icon: string;
  meta: string;
  due: string;
  lanternColour?: LanternColour;
}

const NAV_ITEMS: (NavItem & { path: string })[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", active: true, path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "lantern", path: "/decks" },
  { id: "collections", label: "Collections", icon: "/book.png", path: "/collections" },
  { id: "statistics", label: "Statistics", icon: "/stats.png", path: "/statistics" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png", path: "/calendar" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png", path: "/settings" },
];

// placeholder until real deck creation is implemented
const FIRE_STATUS: StatItem[] = [
  { id: "blazing", icon: "lantern", value: 120, label: "Blazing Bright", labelClassName: styles.labelBlazing, lanternColour: "green" },
  { id: "low", icon: "lantern", value: 120, label: "Low Fire", labelClassName: styles.labelLow, lanternColour: "yellow" },
  { id: "flickering", icon: "lantern", value: 120, label: "Flickering", labelClassName: styles.labelFlickering, lanternColour: "red"},
  { id: "broken", icon: "lantern", value: 120, label: "Broken Lanterns", labelClassName: styles.labelBroken, lanternColour: "black" },
];

const RECENT_LANTERNS: StatItem[] = [
  { id: "comp3311", icon: "lantern", value: "COMP3311", label: "40% Complete", isCourse: true, iconVariant: "statCardIconLantern", lanternColour: "green" },
  { id: "comp3231", icon: "lantern", value: "COMP3231", label: "35% Complete", isCourse: true, iconVariant: "statCardIconLantern", lanternColour: "green" },
  { id: "eng2400", icon: "lantern", value: "ENG2400", label: "70% Complete", isCourse: true, iconVariant: "statCardIconLantern", lanternColour: "green" },
  { id: "desn2000", icon: "lantern", value: "DESN2000", label: "65% Complete", isCourse: true, iconVariant: "statCardIconLantern", lanternColour: "green" },
];

const FRIENDS: FriendItem[] = [
  { id: "chupper-1", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
  { id: "chupper-2", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
  { id: "chupper-3", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
];

const UPCOMING_TASKS: TaskItem[] = [
  { id: "task-1", title: "Exam Notes", icon: "lantern", meta: "8 cards", due: "Due in 2h", lanternColour: "red" },
  { id: "task-2", title: "Exam Notes", icon: "lantern", meta: "8 cards", due: "Due in 2h", lanternColour: "red"},
  { id: "task-3", title: "Exam Notes", icon: "lantern", meta: "8 cards", due: "Due in 2h", lanternColour: "red" },
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

function StatCard({ icon, value, label, labelClassName, isCourse = false, iconVariant, lanternColour = "orange", }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <img className={styles.frameImg} src="/mainFrame3.png" alt="" aria-hidden="true" />
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
      <div className={`${styles.statCardValue} ${isCourse ? styles.statCardValueCourse : ""}`}>
        {value}
      </div>
      <div className={`${styles.statCardLabel} ${labelClassName || ""}`}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user }: {user: AuthUser} = useLoaderData();
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
    { id: "cards-reviewed", icon: "/notes.png", value: user.cardsReviewed ?? 0, label: "Cards Reviewed" },
    { id: "days-passed", icon: "/mountain.png", value: user.daysPassed ?? 0, label: "Days passed" },
    { id: "refined-lanterns", icon: "lantern", value: user.refinedLanterns ?? 0, label: "Refined Lanterns", lanternColour: "gold" },
    { id: "lanterns-built", icon: "lantern", value: user.lanternsBuilt ?? 0, label: "Lanterns Built" },
  ];

  const dailyStreakDays = user.dailyStreak ?? 0;

   return (
    <div className={styles.dashboardRoot}>
      <img className={styles.bgImage} src="/learnternBackground.png" alt="" aria-hidden="true" />
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
                {FIRE_STATUS.map(({ id, ...stat }) => (
                  <StatCard key={id} {...stat} />
                ))}
              </div>
            </div>
          </Panel>

          {/* Recent lanterns */}
          <Panel frame="/mainFrame.png">
            <div className={styles.panelInner}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitle}>Recent lanterns</h2>
                <button className={styles.btnViewAll} type="button">
                  <img className={styles.frameImg} src="viewAll.png" alt="" aria-hidden="true" />
                  <span className={styles.btnViewAllLabel}>View all</span>
                </button>
              </div>
              <div className={styles.statGrid}>
                {RECENT_LANTERNS.map(({ id, ...stat }) => (
                  <StatCard key={id} {...stat} />
                ))}
              </div>
            </div>
          </Panel>

        </main>

        {/* RIGHT COLUMN */}
        <aside className={styles.rightColumn}>

          {/* PROFILE CARD */}
          <Panel frame="/profileFrame.png" className={styles.profileCard}>
            <div className={styles.profileCardInner}>
              <img className={styles.avatar} src={profile.avatar} alt={`${profile.name} avatar`} />
              <div className={styles.profileCardInfo}>
                <div className={styles.profileCardName}>{profile.name}</div>
                <div className={styles.profileCardLevel}>Level {profile.level}</div>
                <div className={styles.profileCardXp}>{profile.xp}/{profile.xpMax} XP</div>
              </div>
              <button className={styles.iconBtn} aria-label="Settings" onClick={() => navigate("/settings")}>
                <img src="/door.png" alt="" />
              </button>
            </div>
          </Panel>

          <Panel frame="friendsFrame.png">
            <div className={styles.panelInner}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleCenter}`}>Friends</h2>
              <ul className={styles.listCards}>
              {FRIENDS.map((friend) => (
                <li key={friend.id} className={styles.listCard}>
                  <button
                    className={styles.listCardBtn}
                    onClick={() => navigate(`/friends/${friend.id}`)}
                    type="button"
                  >
                    <img className={styles.frameImg} src="/profileFrame.png" alt="" aria-hidden="true" />
                    <img className={styles.listCardAvatar} src={friend.avatar} alt={`${friend.name} avatar`} />
                    <div className={styles.listCardInfo}>
                      <div className={styles.listCardName}>{friend.name}</div>
                      <div className={styles.listCardMeta}>{friend.meta}</div>
                    </div>
                    <div className={styles.streakPill}>
                      <span>{friend.streak}</span>
                      <AnimatedFire className={styles.streakPillIcon} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            </div>
          </Panel>

          <Panel frame="/TasksFrame.png">
            <div className={styles.panelInner}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleCenter}`}>Upcoming Tasks</h2>
              <ul className={styles.listCards}>
                {UPCOMING_TASKS.map((task) => (
                  <li key={task.id} className={styles.listCard}>
                    <button
                      className={styles.listCardBtn}
                      onClick={() => navigate(`/friends/${task.id}`)}
                      type="button"
                    >
                      <img className={styles.frameImg} src="/TasksFrame2.png" alt="" aria-hidden="true" />
                      {task.icon === "lantern" ? (
                        <AnimatedLantern
                          colour={task.lanternColour}
                          className={styles.listCardAvatar}
                        />
                      ) : (
                        <img className={styles.listCardAvatar} src={task.icon} alt="" />
                      )}
                      <div className={styles.listCardInfo}>
                        <div className={styles.listCardName}>{task.title}</div>
                        <div className={styles.listCardMeta}>{task.meta}</div>
                      </div>
                      <div className={styles.duePill}>{task.due}</div>
                    </button>
                  </li>
                ))}
              </ul>
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
