import { Deck } from "../models/Deck.js";
import { LearntenAPIError } from "./errors.js";

export async function assertOwnsDeck(deckId: string, userId: string) {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new LearntenAPIError("Could not find deck,", 404);
  if (deck.creatorId.toString() !== userId) throw new LearntenAPIError("You are not the creator of this deck.", 403);
  return deck;
}

/**
 * Ensures a deck exists and is visible to the given user: either the deck is
 * public, or the user is its creator. Private decks stay hidden from anyone
 * else, while the creator can always see their own (public or not).
 */
export async function assertCanAccessDeck(deckId: string, userId?: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);
  const isCreator = !!userId && userId === deck.creatorId.toString();
  if (!deck.isPublic && !isCreator) throw new LearntenAPIError("Deck is not public.", 403);
  return { deck, isCreator };
}