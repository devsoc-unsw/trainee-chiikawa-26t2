import { Form, redirect, useLoaderData } from "react-router";
import { authClient } from "../../lib/auth";
import React from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router";

export async function dashboardLoader() {
  console.log("loader started", new Error().stack);
  const session = await authClient.getSession();
  console.log("session result:", session);

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
  image ?: string | null | undefined;
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
}
 
interface UserInfo {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpMax: number;
}
 
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", active: true },
  { id: "lanterns", label: "Lanterns", icon: "/lantern.png" },
  { id: "collections", label: "Collections", icon: "/book.png" },
  { id: "statistics", label: "Statistics", icon: "/stats.png" },
  { id: "calendar", label: "Calendar", icon: "/calendar.png" },
  { id: "settings", label: "Settings", icon: "/cogwheel.png" },
];
 
const OVERVIEW_STATS: StatItem[] = [
  { id: "cards-reviewed", icon: "/notes.png", value: 240, label: "Cards Reviewed" },
  { id: "days-passed", icon: "/mountain.png", value: 78, label: "Days passed" },
  { id: "refined-lanterns", icon: "/goldLantern.png", value: 10, label: "Refined Lanterns" },
  { id: "lanterns-built", icon: "/lantern.png", value: 100, label: "Lanterns Built" },
];
 
const FIRE_STATUS: StatItem[] = [
  { id: "blazing", icon: "/Blazing.png", value: 120, label: "Blazing Bright", labelClassName: styles.labelBlazing },
  { id: "low", icon: "/LowFire.png", value: 120, label: "Low Fire", labelClassName: styles.labelLow },
  { id: "flickering", icon: "/Flickering.png", value: 120, label: "Flickering", labelClassName: styles.labelFlickering },
  { id: "broken", icon: "/deadlantern.png", value: 120, label: "Broken Lanterns", labelClassName: styles.labelBroken },
];
 
const RECENT_LANTERNS: StatItem[] = [
  { id: "comp3311", icon: "/Blazing.png", value: "COMP3311", label: "40% Complete", isCourse: true, iconVariant: "statCardIconLantern" },
  { id: "comp3231", icon: "/Blazing.png", value: "COMP3231", label: "35% Complete", isCourse: true, iconVariant: "statCardIconLantern" },
  { id: "eng2400", icon: "/Blazing.png", value: "ENG2400", label: "70% Complete", isCourse: true, iconVariant: "statCardIconLantern" },
  { id: "desn2000", icon: "/Blazing.png", value: "DESN2000", label: "65% Complete", isCourse: true, iconVariant: "statCardIconLantern" },
];
 
const FRIENDS: FriendItem[] = [
  { id: "chupper-1", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
  { id: "chupper-2", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
  { id: "chupper-3", name: "Chupper", avatar: "/defaultProfile.png", meta: "10 cards reviewed today", streak: 26 },
];
 
const UPCOMING_TASKS: TaskItem[] = [
  { id: "task-1", title: "Exam Notes", icon: "/Flickering.png", meta: "8 cards", due: "Due in 2h" },
  { id: "task-2", title: "Exam Notes", icon: "/Flickering.png", meta: "8 cards", due: "Due in 2h" },
  { id: "task-3", title: "Exam Notes", icon: "/Flickering.png", meta: "8 cards", due: "Due in 2h" },
];
 
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
 
interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  labelClassName?: string;
  isCourse?: boolean;
  iconVariant?: "statCardIconLantern";
}
 
function StatCard({ icon, value, label, labelClassName, isCourse = false, iconVariant }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <img className={styles.frameImg} src="/mainFrame3.png" alt="" aria-hidden="true" />
      <img
        className={`${styles.statCardIcon} ${iconVariant ? styles[iconVariant] : ""}`}
        src={icon}
        alt=""
      />
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
  /*
  return <>
    <h2>user dashboard</h2>
    <p>{user ? "You are logged in as " + user.name : "You are not logged in"}</p>
    {user && <Form method="post" action="/logout">
      <button type="submit">logout</button>
    </Form>}
  </>
  */
   return (
    <div className={styles.dashboardRoot}>
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
            <button className={styles.iconBtn} aria-label="Settings">
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
                >
                  <img className={styles.navIcon} src={item.icon} alt="" />
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
                {OVERVIEW_STATS.map(({ id, ...stat }) => (
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
                      <img className={styles.streakPillIcon} src="/fire.png" alt="" />
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
                      <img className={styles.listCardAvatar} src={task.icon} alt="" />
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