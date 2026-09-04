import { UserProfile } from "../models/UserProfile.js";
import {
  getXpForLevel,
  STREAK_MILESTONES,
} from "../utils/constants.js";

/**
 * Award XP to a user and handle level-ups.
 * Returns the updated profile and whether a level-up occurred.
 */
export async function awardXp(userId: string, amount: number) {
  const profile = await getOrCreateProfile(userId);
  profile.xp += amount;

  // Check for level-ups
  let leveledUp = false;
  while (profile.xp >= getTotalXpForLevel(profile.level + 1)) {
    profile.level += 1;
    leveledUp = true;
  }

  await profile.save();
  return { profile, leveledUp };
}

/**
 * Calculate total XP needed to reach a given level.
 * Level 1 = 0 XP, Level 2 = 150 XP, Level 3 = 350 XP, etc.
 */
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

/**
 * Get XP progress for display: "Level X — Y/Z XP"
 */
export function getXpProgress(xp: number, level: number) {
  const currentLevelTotal = getTotalXpForLevel(level);
  const nextLevelTotal = getTotalXpForLevel(level + 1);
  const xpInCurrentLevel = xp - currentLevelTotal;
  const xpRequiredForLevel = nextLevelTotal - currentLevelTotal;

  return {
    level,
    currentXp: xpInCurrentLevel,
    requiredXp: xpRequiredForLevel,
    totalXp: xp,
  };
}

/**
 * Check if a streak count matches a milestone and return bonus XP.
 * Returns 0 if not a milestone.
 */
export function checkStreakMilestone(streak: number): number {
  return STREAK_MILESTONES[streak] ?? 0;
}

/**
 * Get or create a user profile. Ensures one always exists for the user.
 */
export async function getOrCreateProfile(userId: string) {
  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = await UserProfile.create({ userId });
  }
  return profile;
}
