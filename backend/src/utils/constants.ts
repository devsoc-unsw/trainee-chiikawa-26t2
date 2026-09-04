// ──── Lantern Status ────
// Stored as a number 0–100, mapped to tiers
export const LANTERN_TIERS = {
  BROKEN: "Broken",
  FLICKERING: "Flickering",
  LOW_FIRE: "Low Fire",
  BLAZING_BRIGHT: "Blazing Bright",
} as const;

export type LanternTier = (typeof LANTERN_TIERS)[keyof typeof LANTERN_TIERS];

export const LANTERN_THRESHOLDS = {
  BROKEN_MAX: 24,
  FLICKERING_MAX: 49,
  LOW_FIRE_MAX: 74,
  BLAZING_BRIGHT_MIN: 75,
} as const;

export const LANTERN_INCREMENTS = {
  SCHEDULED_ON_TIME: 15,
  MANUAL_REVIEW: 7,
  MISSED_SCHEDULED: -25,
  MISSED_SCHEDULED_REFINED: -12, // half penalty if refined lantern + high stability
} as const;

export const LANTERN_MIN = 0;
export const LANTERN_MAX = 100;
export const LANTERN_DEFAULT = 50; // starts at Low Fire

// Minimum consecutive on-time scheduled reviews to gain lantern status
export const LANTERN_STREAK_REQUIRED = 2;

export function getLanternTier(status: number): LanternTier {
  if (status <= LANTERN_THRESHOLDS.BROKEN_MAX) return LANTERN_TIERS.BROKEN;
  if (status <= LANTERN_THRESHOLDS.FLICKERING_MAX) return LANTERN_TIERS.FLICKERING;
  if (status <= LANTERN_THRESHOLDS.LOW_FIRE_MAX) return LANTERN_TIERS.LOW_FIRE;
  return LANTERN_TIERS.BLAZING_BRIGHT;
}

// ──── XP ────
export const XP_AMOUNTS = {
  SCHEDULED_REVIEW: 10,
  MANUAL_REVIEW: 5,
  CARD_MASTERY_BONUS: 50,
  DECK_MASTERY_BONUS: 200,
} as const;

export const STREAK_MILESTONES: Record<number, number> = {
  7: 25,
  14: 50,
  30: 100,
  60: 200,
  100: 500,
};

// Level XP formula: XP needed to reach level N = 100 + (N * 50)
export function getXpForLevel(level: number): number {
  return 100 + level * 50;
}

// ──── Mastery ──── Currently requires 31 days of stability (note anki regards 21 days of stability to be mature)
export const MASTERY_STABILITY_THRESHOLD = 31; // days of stability for card mastery
export const REFINED_LANTERN_THRESHOLD = 31;   // average deck stability for refined lantern

// ──── Daily Limits ────
export const DEFAULT_DAILY_NEW_CARD_LIMIT = 20;

// ──── Review Modes ────
export const REVIEW_MODES = {
  SCHEDULED: "scheduled",
  MANUAL: "manual",
  PREVIEW: "preview",
} as const;

export type ReviewMode = (typeof REVIEW_MODES)[keyof typeof REVIEW_MODES];
