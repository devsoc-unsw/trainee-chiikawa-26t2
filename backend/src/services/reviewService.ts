import {
  createEmptyCard,
  fsrs,
  Grade,
  Rating,
  State,
  type Card as FSRSCard,
} from "ts-fsrs";
import { Card } from "../models/Card.js";
import { CardState } from "../models/CardState.js";
import { DeckState } from "../models/DeckState.js";
import { Deck } from "../models/Deck.js";
import { ReviewLog } from "../models/ReviewLog.js";
import { LearntenAPIError } from "../utils/errors.js";
import {
  REVIEW_MODES,
  XP_AMOUNTS,
  LANTERN_INCREMENTS,
  LANTERN_MIN,
  LANTERN_MAX,
  LANTERN_DEFAULT,
  LANTERN_STREAK_REQUIRED,
  MASTERY_STABILITY_THRESHOLD,
  REFINED_LANTERN_THRESHOLD,
  DEFAULT_DAILY_NEW_CARD_LIMIT,
  type ReviewMode,
} from "../utils/constants.js";
import { awardXp, checkStreakMilestone, getOrCreateProfile } from "./xpService.js";

// ──── Helpers ────

function isSameDay(d1: Date | null | undefined, d2: Date): boolean {
  if (!d1) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function clampLantern(value: number): number {
  return Math.max(LANTERN_MIN, Math.min(LANTERN_MAX, value));
}

/** Convert a mongoose CardState fsrs sub-document to a ts-fsrs Card object. */
function toFSRSCard(fsrsData: any): FSRSCard {
  if (!fsrsData || fsrsData.state === undefined || fsrsData.state === State.New) {
    return createEmptyCard();
  }
  return {
    due: new Date(fsrsData.due),
    stability: fsrsData.stability ?? 0,
    difficulty: fsrsData.difficulty ?? 0,
    elapsed_days: fsrsData.elapsed_days ?? 0,
    scheduled_days: fsrsData.scheduled_days ?? 0,
    reps: fsrsData.reps ?? 0,
    lapses: fsrsData.lapses ?? 0,
    state: fsrsData.state ?? State.New,
    last_review: fsrsData.last_review ? new Date(fsrsData.last_review) : undefined,
    learning_steps: fsrsData.learning_steps ?? 0,
  } as FSRSCard;
}

/** Get or create per-user per-deck state. */
async function getOrCreateDeckState(userId: string, deckId: string) {
  let deckState = await DeckState.findOne({ userId, deckId });
  if (!deckState) {
    deckState = await DeckState.create({
      userId,
      deckId,
      desiredRetention: 0.9,
      dailyNewCardLimit: DEFAULT_DAILY_NEW_CARD_LIMIT,
    });
  }

  // Reset daily new card counter if it's a new day
  const now = new Date();
  if (!isSameDay(deckState.newCardsResetDate, now)) {
    deckState.newCardsIntroducedToday = 0;
    deckState.newCardsResetDate = now;
    await deckState.save();
  }

  return deckState;
}

/** Get or create per-user per-card state. */
async function getOrCreateCardState(userId: string, cardId: string, deckId: string) {
  let cardState = await CardState.findOne({ userId, cardId });
  if (!cardState) {
    cardState = await CardState.create({
      userId,
      cardId,
      deckId,
      fsrs: {
        state: State.New,
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        learning_steps: 0,
      },
      lanternStatus: LANTERN_DEFAULT,
    });
  }
  return cardState;
}

// ──── Public API ────

/**
 * Get cards due for scheduled review (FSRS-based).
 * Returns cards whose due date is <= now, plus new cards up to the daily limit.
 */
export async function getScheduledCards(userId: string, deckId: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);

  const deckState = await getOrCreateDeckState(userId, deckId);

  const now = new Date();

  // Get all card states for this user+deck
  const existingStates = await CardState.find({ userId, deckId }).lean();
  const stateByCardId = new Map(
    existingStates.map((s) => [s.cardId.toString(), s]),
  );

  // Get all cards in the deck
  const allCards = await Card.find({ deckId }).sort({ order: 1 }).lean();

  const dueCards: any[] = [];
  const newCards: any[] = [];
  let newCardCount = 0;

  for (const card of allCards) {
    const state = stateByCardId.get(card._id.toString());

    if (!state) {
      // Card has no state yet — it's a new card
      if (newCardCount < (deckState.dailyNewCardLimit - deckState.newCardsIntroducedToday)) {
        newCards.push({ ...card, cardState: null, isNew: true });
        newCardCount++;
      }
    } else if (state.fsrs &&
      state.fsrs.state === State.New &&
      newCardCount < (deckState.dailyNewCardLimit - deckState.newCardsIntroducedToday)
    ) {
      // Card exists but is still in New state
      newCards.push({ ...card, cardState: state, isNew: true });
      newCardCount++;
    } else if (state.fsrs &&
      state.fsrs.state !== State.New &&
      state.fsrs.due &&
      new Date(state.fsrs.due) <= now
    ) {
      // Card is due for review
      dueCards.push({ ...card, cardState: state, isNew: false });
    }
  }

  return {
    dueCards,
    newCards,
    totalDue: dueCards.length,
    totalNew: newCards.length,
    dailyNewCardLimit: deckState.dailyNewCardLimit,
    newCardsIntroducedToday: deckState.newCardsIntroducedToday,
  };
}

/**
 * Get all cards in a deck for manual review mode.
 * Includes card state if it exists.
 */
export async function getAllDeckCardsForReview(userId: string, deckId: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);

  const allCards = await Card.find({ deckId }).sort({ order: 1 }).lean();
  const existingStates = await CardState.find({ userId, deckId }).lean();
  const stateByCardId = new Map(
    existingStates.map((s) => [s.cardId.toString(), s]),
  );

  return allCards.map((card) => ({
    ...card,
    cardState: stateByCardId.get(card._id.toString()) ?? null,
  }));
}

/**
 * Get all cards for preview mode (no auth needed).
 */
export async function previewDeckCards(deckId: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);
  if (!deck.isPublic) throw new LearntenAPIError("Deck is not public.", 403);

  return Card.find({ deckId }).sort({ order: 1 }).lean();
}

/**
 * Get a preview of all 4 possible review outcomes for a card (using fsrs.repeat).
 */
export async function getReviewPreview(userId: string, cardId: string, deckId: string) {
  const deckState = await getOrCreateDeckState(userId, deckId);
  const cardState = await getOrCreateCardState(userId, cardId, deckId);

  const scheduler = fsrs({ request_retention: deckState.desiredRetention });
  const card = toFSRSCard(cardState.fsrs);
  const now = new Date();

  const preview = scheduler.repeat(card, now);

  return {
    [Rating.Again]: {
      card: preview[Rating.Again].card,
      log: preview[Rating.Again].log,
    },
    [Rating.Hard]: {
      card: preview[Rating.Hard].card,
      log: preview[Rating.Hard].log,
    },
    [Rating.Good]: {
      card: preview[Rating.Good].card,
      log: preview[Rating.Good].log,
    },
    [Rating.Easy]: {
      card: preview[Rating.Easy].card,
      log: preview[Rating.Easy].log,
    },
  };
}

/**
 * Submit a review for a card.
 * This is the core review handler that processes FSRS, updates stats, awards XP, etc.
 */
export async function submitReview(
  userId: string,
  cardId: string,
  deckId: string,
  rating: number,
  reviewMode: ReviewMode,
) {
  // Validate rating
  if (![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(rating)) {
    throw new LearntenAPIError("Invalid rating. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).", 400);
  }

  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);

  const card = await Card.findOne({ _id: cardId, deckId }).lean();
  if (!card) throw new LearntenAPIError("Card not found in deck.", 404);

  // Preview mode — no state changes
  if (reviewMode === REVIEW_MODES.PREVIEW) {
    await ReviewLog.create({
      userId,
      cardId,
      deckId,
      rating,
      reviewMode,
      xpEarned: 0,
    });
    return { message: "Preview review recorded.", xpEarned: 0, cardState: null };
  }

  const now = new Date();
  const deckState = await getOrCreateDeckState(userId, deckId);
  const cardState = await getOrCreateCardState(userId, cardId, deckId);
  const profile = await getOrCreateProfile(userId);

  // Track previous state for logging
  const previousState = cardState!.fsrs!.state ?? State.New;
  const previousStability = cardState!.fsrs!.stability ?? 0;

  // ── Determine if this review should count ──
  const alreadyReviewedToday = isSameDay(cardState.lastReviewDate, now);
  const manualAlreadyCountedToday = isSameDay(cardState.lastManualReviewDate, now);

  let shouldCountForStats = false;
  let isPreviewLike = false;

  if (reviewMode === REVIEW_MODES.SCHEDULED) {
    shouldCountForStats = !alreadyReviewedToday;
  } else if (reviewMode === REVIEW_MODES.MANUAL) {
    // Manual reviews only count once per day, otherwise treated as preview
    if (manualAlreadyCountedToday) {
      isPreviewLike = true;
    } else {
      shouldCountForStats = !alreadyReviewedToday;
    }
  }

  // ── Run FSRS ──
  let xpEarned = 0;
  const scheduler = fsrs({ request_retention: deckState.desiredRetention });

  if (!isPreviewLike) {
    const fsrsCard = toFSRSCard(cardState.fsrs);

    // For manual review: if card is Review/Relearning state, FSRS will recognize
    // the early due date and affect stability less (built into the algorithm)
    const result = scheduler.next(fsrsCard, now, rating as Grade);
    const newCard = result.card;

    // Update FSRS data on card state
    cardState.fsrs = {
      difficulty: newCard.difficulty,
      due: newCard.due,
      elapsed_days: newCard.elapsed_days,
      lapses: newCard.lapses,
      last_review: newCard.last_review ?? now,
      learning_steps: newCard.learning_steps,
      reps: newCard.reps,
      scheduled_days: newCard.scheduled_days,
      stability: newCard.stability,
      state: newCard.state,
    };

    // Track if this was a new card being introduced
    if (previousState === State.New) {
      deckState.newCardsIntroducedToday += 1;
      await deckState.save();
    }

    // ── Update lantern status ──
    if (reviewMode === REVIEW_MODES.SCHEDULED && shouldCountForStats) {
      // On-time scheduled review
      cardState.consecutiveOnTime += 1;
      if (cardState.consecutiveOnTime >= LANTERN_STREAK_REQUIRED) {
        cardState.lanternStatus = clampLantern(
          cardState.lanternStatus + LANTERN_INCREMENTS.SCHEDULED_ON_TIME,
        );
      }
      xpEarned = XP_AMOUNTS.SCHEDULED_REVIEW;
    } else if (reviewMode === REVIEW_MODES.MANUAL && shouldCountForStats) {
      // Manual review — half lantern and XP
      cardState.lanternStatus = clampLantern(
        cardState.lanternStatus + LANTERN_INCREMENTS.MANUAL_REVIEW,
      );
      cardState.lastManualReviewDate = now;
      xpEarned = XP_AMOUNTS.MANUAL_REVIEW;
    }

    // ── Check for card mastery milestone ──
    if (
      previousStability < MASTERY_STABILITY_THRESHOLD &&
      newCard.stability >= MASTERY_STABILITY_THRESHOLD
    ) {
      xpEarned += XP_AMOUNTS.CARD_MASTERY_BONUS;
    }

    // Update card state tracking
    if (shouldCountForStats) {
      cardState.lastReviewDate = now;
      cardState.totalReviews += 1;
    }

    await cardState.save();

    // ── Update user profile ──
    if (shouldCountForStats) {
      // Reset daily counters if it's a new day
      if (!isSameDay(profile.dailyResetDate, now)) {
        profile.dailyReviewedCardIds = [];
        profile.totalCardsReviewedToday = 0;
        profile.dailyResetDate = now;
      }

      // Only count one review per card per day
      const cardIdStr = cardId.toString();
      const alreadyCounted = profile.dailyReviewedCardIds.some(
        (id) => id.toString() === cardIdStr,
      );
      if (!alreadyCounted) {
        profile.dailyReviewedCardIds.push(cardId as any);
        profile.totalCardsReviewedToday += 1;
        profile.totalCardsReviewedAllTime += 1;
      }

      // Update review streak
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!profile.lastReviewDate) {
        // First ever review
        profile.reviewStreak = 1;
      } else if (isSameDay(profile.lastReviewDate, now)) {
        // Already reviewed today, streak stays
      } else if (isSameDay(profile.lastReviewDate, yesterday)) {
        // Reviewed yesterday, increment streak
        profile.reviewStreak += 1;
      } else {
        // Missed days, reset streak
        profile.reviewStreak = 1;
      }

      profile.lastReviewDate = now;
      await profile.save();

      // Check for streak milestones
      const streakBonus = checkStreakMilestone(profile.reviewStreak);
      if (streakBonus > 0) {
        xpEarned += streakBonus;
      }

      // Award XP
      if (xpEarned > 0) {
        await awardXp(userId, xpEarned);
      }
    }

    // ── Check for deck mastery / refined lantern ──
    await checkDeckMastery(userId, deckId);
  }

  // ── Create review log ──
  await ReviewLog.create({
    userId,
    cardId,
    deckId,
    rating,
    reviewMode: isPreviewLike ? REVIEW_MODES.PREVIEW : reviewMode,
    previousState,
    newState: cardState.fsrs?.state ?? previousState,
    previousStability,
    newStability: cardState.fsrs?.stability ?? previousStability,
    scheduledDays: cardState.fsrs?.scheduled_days ?? 0,
    elapsedDays: cardState.fsrs?.elapsed_days ?? 0,
    xpEarned,
  });

  return {
    cardState: cardState.toObject(),
    xpEarned,
    isPreviewLike,
    message: isPreviewLike
      ? "Manual review already counted today. No change to statistics"
      : "Review submitted successfully.",
  };
}

/**
 * Check and update deck mastery / refined lantern status.
 */
async function checkDeckMastery(userId: string, deckId: string) {
  const cardStates = await CardState.find({ userId, deckId }).lean();
  if (cardStates.length === 0) return;

  const totalStability = cardStates.reduce(
    (sum, cs) => sum + (cs.fsrs?.stability ?? 0),
    0,
  );
  const avgStability = totalStability / cardStates.length;

  const masteryPercent = Math.round((cardStates.filter(
    (cs) => (cs.fsrs?.stability ?? 0) >= 21,
  ).length / cardStates.length) * 100);

  const deckState = await DeckState.findOne({ userId, deckId });
  if (!deckState) return;

  const wasRefined = deckState.isRefinedLantern;
  deckState.isRefinedLantern = avgStability >= REFINED_LANTERN_THRESHOLD;
  // deckState.isRefinedLantern = masteryPercent == 100;

  if (!wasRefined && deckState.isRefinedLantern) {
    // Just reached refined lantern — award bonus XP
    await awardXp(userId, XP_AMOUNTS.DECK_MASTERY_BONUS);
  }

  await deckState.save();
}

/**
 * Process missed scheduled reviews (lantern status penalty).
 * Should be called when fetching scheduled cards to penalize cards that were due but not reviewed.
 */
export async function processMissedReviews(userId: string, deckId: string) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // Find cards that were due before today but weren't reviewed
  const overdueStates = await CardState.find({
    userId,
    deckId,
    "fsrs.due": { $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    "fsrs.state": { $in: [State.Review, State.Relearning] },
    $or: [
      { lastReviewDate: null },
      { lastReviewDate: { $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
    ],
  });

  const deckState = await DeckState.findOne({ userId, deckId }).lean();
  const isRefined = deckState?.isRefinedLantern ?? false;

  for (const state of overdueStates) {
    const highStability = (state.fsrs?.stability ?? 0) >= MASTERY_STABILITY_THRESHOLD;
    const penalty =
      isRefined && highStability
        ? LANTERN_INCREMENTS.MISSED_SCHEDULED_REFINED
        : LANTERN_INCREMENTS.MISSED_SCHEDULED;

    state.lanternStatus = clampLantern(state.lanternStatus + penalty);
    state.consecutiveOnTime = 0;
    await state.save();
  }

  return overdueStates.length;
}
