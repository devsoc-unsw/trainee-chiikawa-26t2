import { Card } from "../models/Card.js";
import { Deck } from "../models/Deck.js";
import { assertOwnsDeck } from "../utils/deckUtils.js";
import { LearntenAPIError } from "../utils/errors.js";

export async function createDeck(userId: string, data: { title: string; description?: string; isPublic: boolean }) {
  return Deck.create({ ...data, creatorId: userId });
}

export async function getMyDecks(userId: string) {
  return Deck.find({ creatorId: userId }).sort({ updatedAt: -1 }).lean();
}

export async function getDeck(deckId: string, userId?: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck,", 404);
  const isCreator = userId === deck.creatorId.toString();
  if (!deck.isPublic && !isCreator) throw new LearntenAPIError("Deck is not public.", 403);
  return { ...deck, isCreator: isCreator };
}

export async function getDeckCards(deckId: string, userId?: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) throw new LearntenAPIError("Could not find deck,", 404);
  const isCreator = userId === deck.creatorId.toString();
  if (!deck.isPublic && !isCreator) throw new LearntenAPIError("Deck is not public.", 403);
  return Card.find({ deckId }).sort({ order: 1 }).lean();
}

/**
 * Updates information about a deck (not the cards)
 * @param deckId The deck object id
 * @param userId The user object id
 * @param updates fields to update
 * @returns the updated deck
 */
export async function updateDeck(deckId: string, userId: string, updates: Partial<{ title: string; description: string; isPublic: boolean }>) {
  const deck = await assertOwnsDeck(deckId, userId);
  Object.assign(deck, updates);
  await deck.save();
  return deck;
}

export async function deleteDeck(deckId: string, userId: string) {
  const deck = await assertOwnsDeck(deckId, userId);
  await Card.deleteMany({ deckId });
  await deck.deleteOne();
}
