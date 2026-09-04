const BASE_URL = import.meta.env.VITE_BACKEND_URL;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body, fall back to statusText
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Deck {
  _id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  creatorId: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  deckId: string;
  front: string;
  back: string;
  order: number;
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  isPublic: boolean;
}

export interface AddCardInput {
  front: string;
  back: string;
}

export const LANTERN_TIERS = {
  BROKEN: "Broken",
  FLICKERING: "Flickering",
  LOW_FIRE: "Low Fire",
  BLAZING_BRIGHT: "Blazing Bright",
} as const;

export type LanternTier = (typeof LANTERN_TIERS)[keyof typeof LANTERN_TIERS];

export interface DashboardStats {
  reviewStreak: number;
  totalCardsReviewedToday: number;
  totalCardsReviewedAllTime: number;
  totalDueToday: number;
  lanternBreakdown: Record<LanternTier, number>;
  decks: {
    deckId: string;
    title: string;
    cardCount: number;
    dueToday: number;
    newCards: number;
    averageStability: number;
    isRefinedLantern: boolean;
    masteryPercent: number;
  }[];
  level: number;
  currentXp: number;
  requiredXp: number;
  totalXp: number;
}

export function getDashboardStats() {
  return request<DashboardStats>("/api/stats/dashboard");
}

// POST /api/decks
export function createDeck(data: CreateDeckInput) {
  return request<Deck>("/api/decks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// GET /api/decks/mine - every deck owned by the signed-in user
export function listMyDecks() {
  return request<Deck[]>("/api/decks/mine");
}

// GET /api/decks/:deckId
export function getDeck(deckId: string) {
  return request<Deck & { isCreator: boolean }>(`/api/decks/${deckId}`);
}

// GET /api/decks/:deckId/cards
export function getDeckCards(deckId: string) {
  return request<Card[]>(`/api/decks/${deckId}/cards`);
}

// PUT /api/decks/:deckId
export function updateDeck(deckId: string, updates: Partial<CreateDeckInput>) {
  return request<Deck>(`/api/decks/${deckId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// DELETE /api/decks/:deckId
export function deleteDeck(deckId: string) {
  return request<void>(`/api/decks/${deckId}`, { method: "DELETE" });
}

// POST /api/decks/:deckId/cards
export function addCard(deckId: string, data: AddCardInput) {
  return request<Card>(`/api/decks/${deckId}/cards`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT /api/decks/:deckId/cards/:cardId
export function updateCard(deckId: string, cardId: string, updates: Partial<AddCardInput>) {
  return request<Card>(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// DELETE /api/decks/:deckId/cards/:cardId
export function deleteCard(deckId: string, cardId: string) {
  return request<void>(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" });
}


// ── Review system types & endpoints ──

export interface FsrsCardData {
  state: number; // ts-fsrs State enum: 0=New, 1=Learning, 2=Review, 3=Relearning
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  last_review?: string;
}

export interface CardStateData {
  _id: string;
  userId: string;
  cardId: string;
  deckId: string;
  fsrs: FsrsCardData;
  lanternStatus: number;
  consecutiveOnTime: number;
  lastReviewDate: string | null;
  lastManualReviewDate: string | null;
  totalReviews: number;
}

export interface CardWithState extends Card {
  cardState: CardStateData | null;
  isNew?: boolean;
}

export interface ScheduledCardsResponse {
  dueCards: CardWithState[];
  newCards: CardWithState[];
  totalDue: number;
  totalNew: number;
  dailyNewCardLimit: number;
  newCardsIntroducedToday: number;
}

export interface SubmitReviewResult {
  cardState: CardStateData;
  xpEarned: number;
  isPreviewLike: boolean;
  message: string;
}

// ASSUMPTION: matches backend utils/constants.ts REVIEW_MODES — confirm these string
// values against the actual file, since reviewController just forwards whatever string
// the client sends and validates it's one of these three.
export const REVIEW_MODES = {
  SCHEDULED: "scheduled",
  MANUAL: "manual",
  PREVIEW: "preview",
} as const;
export type ReviewMode = (typeof REVIEW_MODES)[keyof typeof REVIEW_MODES];

// Matches ts-fsrs's Rating enum (Manual=0 is unused here since the manual REVIEW
// MODE is a different concept from the unused "Manual" rating).
export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 } as const;
export type RatingValue = (typeof RATING)[keyof typeof RATING];

// ASSUMPTION: mirrors the LANTERN_THRESHOLDS constant from an earlier pass on the
// backend (BROKEN_MAX: 24, FLICKERING_MAX: 49, LOW_FIRE_MAX: 74). Confirm these
// still match utils/constants.ts — if the backend ever exposes categorized counts
// directly, prefer that over recomputing client-side.
const LANTERN_THRESHOLDS = { BROKEN_MAX: 24, FLICKERING_MAX: 49, LOW_FIRE_MAX: 74 } as const;

export function getLanternTier(value: number): LanternTier {
  if (value <= LANTERN_THRESHOLDS.BROKEN_MAX) return LANTERN_TIERS.BROKEN;
  if (value <= LANTERN_THRESHOLDS.FLICKERING_MAX) return LANTERN_TIERS.FLICKERING;
  if (value <= LANTERN_THRESHOLDS.LOW_FIRE_MAX) return LANTERN_TIERS.LOW_FIRE;
  return LANTERN_TIERS.BLAZING_BRIGHT;
}

// GET /api/review/:deckId/preview — public if the deck is public (optionalAuth)
export function getDeckPreviewCards(deckId: string) {
  return request<Card[]>(`/api/review/${deckId}/preview`);
}

// GET /api/review/:deckId/scheduled — requires auth; also triggers missed-review processing server-side
export function getScheduledCards(deckId: string) {
  return request<ScheduledCardsResponse>(`/api/review/${deckId}/scheduled`);
}

// GET /api/review/:deckId/all — requires auth; full deck with per-user card state, for manual review
export function getAllDeckCardsForReview(deckId: string) {
  return request<CardWithState[]>(`/api/review/${deckId}/all`);
}

// POST /api/review/:deckId/cards/:cardId — requires auth
export function submitReview(
  deckId: string,
  cardId: string,
  rating: RatingValue,
  reviewMode: Exclude<ReviewMode, "preview">,
) {
  return request<SubmitReviewResult>(`/api/review/${deckId}/cards/${cardId}`, {
    method: "POST",
    body: JSON.stringify({ rating, reviewMode }),
  });
}

export { ApiError };
