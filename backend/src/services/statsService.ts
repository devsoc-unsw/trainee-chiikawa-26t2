import { State } from "ts-fsrs";
import { Card } from "../models/Card.js";
import { CardState } from "../models/CardState.js";
import { Deck } from "../models/Deck.js";
import { DeckState } from "../models/DeckState.js";
import { ReviewLog } from "../models/ReviewLog.js";
import { getLanternTier, LanternTier } from "../utils/constants.js";
import { LearntenAPIError } from "../utils/errors.js";
import { getOrCreateProfile, getXpProgress } from "./xpService.js";

/**
 * Get comprehensive dashboard statistics for a user.
 */
export async function getUserDashboardStats(userId: string) {
  const profile = await getOrCreateProfile(userId);

  // Reset daily counters if needed
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (
    !profile.dailyResetDate ||
    new Date(profile.dailyResetDate) < todayStart
  ) {
    profile.dailyReviewedCardIds = [];
    profile.totalCardsReviewedToday = 0;
    profile.dailyResetDate = now;
    await profile.save();
  }

  // Get all user's deck states
  const deckStates = await DeckState.find({ userId }).lean();
  const deckIds = deckStates.map((ds) => ds.deckId);

  // Get deck info
  const decks = await Deck.find({ _id: { $in: deckIds } }).lean();

  // Count total cards due today across all decks, and lantern status across ALL cards the
  // user has reviewed (i.e. that have a CardState) — cards never reviewed have no
  // lanternStatus yet, so they're excluded from this breakdown rather than assumed "broken".
  let totalDueToday = 0;
  const lanternBreakdown: Record<LanternTier, number> = {
    "Broken": 0,
    "Flickering": 0,
    "Low Fire": 0,
    "Blazing Bright": 0,
  };
  const deckSummaries = [];

  for (const deck of decks) {
    const deckState = deckStates.find(
      (ds) => ds.deckId.toString() === deck._id.toString(),
    );

    const cardStates = await CardState.find({
      userId,
      deckId: deck._id,
    }).lean();

    let dueCount = 0;
    let totalStability = 0;
    let masteredCount = 0;
    let nextDueAt: Date | null = null;

    for (const cs of cardStates) {
      const stability = cs.fsrs?.stability ?? 0;
      totalStability += stability;

      if (cs.fsrs?.state !== State.New && cs.fsrs?.due && new Date(cs.fsrs.due) <= now) {
        dueCount++;
      }
      if (stability >= 21) {
        masteredCount++;
      }
      if (cs.fsrs?.state !== State.New && cs.fsrs?.due) {
        const due = new Date(cs.fsrs.due);
        if (!nextDueAt || due < nextDueAt) nextDueAt = due;
      }

      lanternBreakdown[getLanternTier(cs.lanternStatus)]++;
    }

    const newCount = deck.cardCount - cardStates.length +
      cardStates.filter((cs) => cs.fsrs?.state === State.New).length;

    totalDueToday += dueCount;

    const avgStability = cardStates.length > 0 ? totalStability / cardStates.length : 0;

    deckSummaries.push({
      deckId: deck._id,
      title: deck.title,
      cardCount: deck.cardCount,
      dueToday: dueCount,
      newCards: newCount,
      nextDueAt,
      averageStability: Math.round(avgStability * 100) / 100,
      isRefinedLantern: deckState?.isRefinedLantern ?? false,
      masteryPercent:
        deck.cardCount > 0 ? Math.round((masteredCount / deck.cardCount) * 100) : 0,
    });
  }

  // Also include decks the user created but might not have a DeckState for
  const ownedDecks = await Deck.find({
    creatorId: userId,
    _id: { $nin: deckIds },
  }).lean();

  for (const deck of ownedDecks) {
    deckSummaries.push({
      deckId: deck._id,
      title: deck.title,
      cardCount: deck.cardCount,
      dueToday: 0,
      newCards: deck.cardCount,
      nextDueAt: null as Date | null,
      averageStability: 0,
      isRefinedLantern: false,
      masteryPercent: 0,
    });
  }

  // Days passed since this user's profile (i.e. their Learntern journey) began.
  const daysPassed = Math.floor(
    (now.getTime() - new Date(profile.createdAt).getTime()) / 86_400_000,
  );

  return {
    ...getXpProgress(profile.xp, profile.level),
    reviewStreak: profile.reviewStreak,
    totalCardsReviewedToday: profile.totalCardsReviewedToday,
    totalCardsReviewedAllTime: profile.totalCardsReviewedAllTime,
    daysPassed,
    totalDueToday,
    lanternBreakdown,
    decks: deckSummaries,
  };
}

/**
 * Get detailed statistics for a specific deck.
 */
export async function getDeckStats(userId: string, deckId: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);

  const deckState = await DeckState.findOne({ userId, deckId }).lean();
  const cardStates = await CardState.find({ userId, deckId }).lean();

  const now = new Date();

  // Card state breakdown
  const stateBreakdown = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    unseen: 0,
  };

  let totalStability = 0;
  let dueToday = 0;

  // Cards in the deck that have no state yet
  stateBreakdown.unseen = Math.max(0, deck.cardCount - cardStates.length);

  for (const cs of cardStates) {
    totalStability += cs.fsrs?.stability ?? 0;

    switch (cs.fsrs?.state) {
      case State.New:
        stateBreakdown.new++;
        break;
      case State.Learning:
        stateBreakdown.learning++;
        break;
      case State.Review:
        stateBreakdown.review++;
        break;
      case State.Relearning:
        stateBreakdown.relearning++;
        break;
    }

    if (
      cs.fsrs?.state !== State.New &&
      cs.fsrs?.due &&
      new Date(cs.fsrs.due) <= now
    ) {
      dueToday++;
    }
  }

  const avgStability =
    cardStates.length > 0 ? totalStability / cardStates.length : 0;

  // Review history — last 7 and 30 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [reviewsLast7Days, reviewsLast30Days] = await Promise.all([
    ReviewLog.countDocuments({
      userId,
      deckId,
      reviewMode: { $ne: "preview" },
      createdAt: { $gte: sevenDaysAgo },
    }),
    ReviewLog.countDocuments({
      userId,
      deckId,
      reviewMode: { $ne: "preview" },
      createdAt: { $gte: thirtyDaysAgo },
    }),
  ]);

  // Daily review counts for chart data (last 30 days)
  const dailyReviews = await ReviewLog.aggregate([
    {
      $match: {
        userId,
        deckId: deck._id,
        reviewMode: { $ne: "preview" },
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    deckId: deck._id,
    title: deck.title,
    totalCards: deck.cardCount,
    dueToday,
    stateBreakdown,
    averageStability: Math.round(avgStability * 100) / 100,
    isRefinedLantern: deckState?.isRefinedLantern ?? false,
    desiredRetention: deckState?.desiredRetention ?? 0.9,
    reviewsLast7Days,
    reviewsLast30Days,
    dailyReviews,
  };
}

/**
 * Get detailed statistics for a specific card.
 */
export async function getCardStats(userId: string, cardId: string) {
  const cardState = await CardState.findOne({ userId, cardId }).lean();

  // Get review history for this card
  const reviewHistory = await ReviewLog.find({ userId, cardId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!cardState) {
    return {
      fsrsState: "New",
      stability: 0,
      difficulty: 0,
      dueDate: null,
      lanternStatus: getLanternTier(50),
      lanternStatusValue: 50,
      consecutiveOnTime: 0,
      totalReviews: 0,
      reviewHistory,
    };
  }

  const stateNames = ["New", "Learning", "Review", "Relearning"];

  return {
    fsrsState: stateNames[cardState.fsrs?.state ?? 0] ?? "New",
    stability: Math.round((cardState.fsrs?.stability ?? 0) * 100) / 100,
    difficulty: Math.round((cardState.fsrs?.difficulty ?? 0) * 100) / 100,
    dueDate: cardState.fsrs?.due,
    reps: cardState.fsrs?.reps ?? 0,
    lapses: cardState.fsrs?.lapses ?? 0,
    lanternStatus: getLanternTier(cardState.lanternStatus),
    lanternStatusValue: cardState.lanternStatus,
    consecutiveOnTime: cardState.consecutiveOnTime,
    totalReviews: cardState.totalReviews,
    lastReviewDate: cardState.lastReviewDate,
    reviewHistory,
  };
}
