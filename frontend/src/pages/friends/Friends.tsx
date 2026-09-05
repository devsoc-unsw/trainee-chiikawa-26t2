import { useState } from "react";
import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router";
import { authClient } from "../../lib/auth";
import {
  listFriends,
  listFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRequest,
  removeFriend as removeFriendApi,
  ApiError,
  type FriendSummary,
} from "../../lib/api";
import styles from "./friends.module.css";

export async function friendsLoader() {
  const session = await authClient.getSession();

  if (!session?.data?.user) {
    return redirect("/login");
  }

  try {
    const [friends, requests] = await Promise.all([listFriends(), listFriendRequests()]);
    return { user: session.data.user, friends, requests, err: false };
  } catch (e) {
    console.error("Could not load your friends:", e);
    return {
      user: session.data.user,
      friends: [] as FriendSummary[],
      requests: { incoming: [] as FriendSummary[], outgoing: [] as FriendSummary[] },
      err: true,
    };
  }
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  level?: number;
  xp?: number;
  xpMax?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/house.png", path: "/dashboard" },
  { id: "lanterns", label: "Lanterns", icon: "/pixelatedlantern.png", path: "/decks" },
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

function FriendRow({
  friend,
  actionLabel,
  actionClassName,
  onAction,
  busy,
  secondaryLabel,
  secondaryClassName,
  onSecondary,
}: {
  friend: FriendSummary;
  actionLabel: string;
  actionClassName: string;
  onAction: () => void;
  busy: boolean;
  secondaryLabel?: string;
  secondaryClassName?: string;
  onSecondary?: () => void;
}) {
  return (
    <li className={styles.row}>
      <img className={styles.rowAvatar} src={friend.avatar} alt="" aria-hidden="true" />
      <div className={styles.rowInfo}>
        <div className={styles.rowName}>{friend.name}</div>
        <div className={styles.rowMeta}>{friend.cardsReviewedToday} cards reviewed today</div>
      </div>
      <div className={styles.streakPill}>
        <img className={styles.streakPillIcon} src="/fire.png" alt="" aria-hidden="true" />
        <span>{friend.reviewStreak}</span>
      </div>
      <div className={styles.rowActions}>
        {secondaryLabel && onSecondary && (
          <button
            className={`${styles.smallBtn} ${secondaryClassName ?? ""}`}
            type="button"
            onClick={onSecondary}
            disabled={busy}
          >
            {secondaryLabel}
          </button>
        )}
        <button
          className={`${styles.smallBtn} ${actionClassName}`}
          type="button"
          onClick={onAction}
          disabled={busy}
        >
          {actionLabel}
        </button>
      </div>
    </li>
  );
}

export default function Friends() {
  const { user, friends, requests, err }: {
    user: AuthUser;
    friends: FriendSummary[];
    requests: { incoming: FriendSummary[]; outgoing: FriendSummary[] };
    err: boolean;
  } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [copied, setCopied] = useState(false);

  function setBusy(id: string, isBusy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (isBusy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setFormError("Enter a user ID or email first.");
      return;
    }

    setSending(true);
    try {
      const result = await sendFriendRequest(trimmed);
      setFormSuccess(result.autoAccepted ? "You're now friends!" : "Friend request sent!");
      setIdentifier("");
      revalidator.revalidate();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not send that request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(requestId: string) {
    setBusy(requestId, true);
    try {
      await acceptFriendRequest(requestId);
      revalidator.revalidate();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not accept that request.");
    } finally {
      setBusy(requestId, false);
    }
  }

  async function handleRemoveRequest(requestId: string) {
    setBusy(requestId, true);
    try {
      await removeFriendRequest(requestId);
      revalidator.revalidate();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not remove that request.");
    } finally {
      setBusy(requestId, false);
    }
  }

  async function handleRemoveFriend(friendUserId: string) {
    setBusy(friendUserId, true);
    try {
      await removeFriendApi(friendUserId);
      revalidator.revalidate();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Could not remove that friend.");
    } finally {
      setBusy(friendUserId, false);
    }
  }

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Could not copy user ID:", e);
    }
  }

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
            <img className={styles.avatar} src={user.image || "/defaultProfile.png"} alt={`${user.name} avatar`} />
            <div className={styles.profileCardInfo}>
              <div className={styles.profileCardName}>{user.name}</div>
              <div className={styles.profileCardLevel}>Level {user.level ?? 1}</div>
              <div className={styles.profileCardXp}>{user.xp ?? 0}/{user.xpMax ?? 100} XP</div>
            </div>
          </div>
        </Panel>

        {/* SIDEBAR NAV */}
        <Panel frame="/navBarFrame.png" className={styles.sidebarNav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={styles.navItem}
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

        {/* MAIN PANEL */}
        <Panel frame="/deckFrame.png" className={styles.mainPanel}>
          <div className={styles.panelInner}>
            <div className={styles.idBadge}>
              <span className={styles.idBadgeLabel}>ID:</span>
              <span className={styles.idBadgeValue}>{user.id}</span>
              <button className={styles.idBadgeCopy} type="button" onClick={handleCopyId}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className={styles.headerRow}>
              <button
                className={styles.backBtn}
                type="button"
                aria-label="Go back"
                onClick={() => navigate(-1)}
              >
                ←
              </button>
              <h2 className={styles.panelTitle}>Friends</h2>
            </div>
            <p className={styles.subtitle}>
              Add friends by their exact user ID or email, and keep track of each other's streaks.
            </p>

            {err && (
              <div className={styles.errorBanner}>
                Something went wrong loading your friends. Try refreshing the page.
              </div>
            )}

            {formError && <div className={styles.errorBanner}>{formError}</div>}
            {formSuccess && <div className={styles.successBanner}>{formSuccess}</div>}

            <form className={styles.addForm} onSubmit={handleSendRequest}>
              <input
                className={styles.addFormInput}
                type="text"
                placeholder="Friend's user ID or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                maxLength={200}
              />
              <button className={styles.primaryBtn} type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send Request"}
              </button>
            </form>

            {/* REQUESTS */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Friend Requests</h3>
              <div className={styles.requestColumns}>
                <div>
                  <p className={styles.requestColumnTitle}>Incoming ({requests.incoming.length})</p>
                  {requests.incoming.length === 0 ? (
                    <div className={styles.emptyState}>No incoming requests.</div>
                  ) : (
                    <ul className={styles.rowList}>
                      {requests.incoming.map((r) => (
                        <FriendRow
                          key={r.requestId}
                          friend={r}
                          busy={busyIds.has(r.requestId)}
                          actionLabel="Accept"
                          actionClassName={styles.acceptBtn}
                          onAction={() => handleAccept(r.requestId)}
                          secondaryLabel="Decline"
                          secondaryClassName={styles.declineBtn}
                          onSecondary={() => handleRemoveRequest(r.requestId)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className={styles.requestColumnTitle}>Outgoing ({requests.outgoing.length})</p>
                  {requests.outgoing.length === 0 ? (
                    <div className={styles.emptyState}>No outgoing requests.</div>
                  ) : (
                    <ul className={styles.rowList}>
                      {requests.outgoing.map((r) => (
                        <FriendRow
                          key={r.requestId}
                          friend={r}
                          busy={busyIds.has(r.requestId)}
                          actionLabel="Cancel"
                          actionClassName={styles.declineBtn}
                          onAction={() => handleRemoveRequest(r.requestId)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* FRIENDS LIST */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Your Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className={styles.emptyState}>
                  You haven't added any friends yet — send a request above to get started.
                </div>
              ) : (
                <ul className={styles.rowList}>
                  {friends.map((f) => (
                    <FriendRow
                      key={f.requestId}
                      friend={f}
                      busy={busyIds.has(f.userId)}
                      actionLabel="Remove"
                      actionClassName={styles.removeBtn}
                      onAction={() => handleRemoveFriend(f.userId)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
