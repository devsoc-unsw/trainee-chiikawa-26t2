import { Card } from "../models/Card.js";
import { Deck } from "../models/Deck.js";

export async function createDeck(userId: string, data: { title: string; description?: string; tags: string[]; subject?: string; isPublic: boolean }) {
  return Deck.create({ ...data, creator: userId });
}

export async function getDeck(deckId: string, userId?: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) return { error: "Could not find deck." };
  const isCreator = userId === deck.creator.toString();
  if (!deck.isPublic && !isCreator) return { error: "Deck is not public" };
  return { ...deck, isCreator: isCreator };
}

export async function getDeckCards(deckId: string, userId?: string) {
  const deck = await Deck.findById(deckId).lean();
  if (!deck) return { error: "Could not find deck." };
  const isCreator = userId === deck.creator.toString();
  if (!deck.isPublic && !isCreator) return { error: "Deck is not public" };
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
  const deck = await Deck.findById(deckId);
  if (!deck) return { error: "Cound not find deck." };
  if (deck.creator.toString() !== userId) return { error: "You are not the creator of the deck." };

  Object.assign(deck, updates);
  await deck.save();
  return deck;
}

export async function deleteDeck(deckId: string, userId: string) {
  const deck = await Deck.findById(deckId);
  if (!deck) return { error: "Cound not find deck." };
  if (deck.creator.toString() !== userId) return { error: "You are not the creator of the deck." };

  await Card.deleteMany({ deckId });
  await deck.deleteOne();
  return null;
}
