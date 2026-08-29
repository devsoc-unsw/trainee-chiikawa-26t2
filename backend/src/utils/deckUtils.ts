import { Deck } from "../models/Deck.js";
import { LearntenAPIError } from "./errors.js";

export async function assertOwnsDeck(deckId: string, userId: string) {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new LearntenAPIError("Could not find deck,", 404);
  if (deck.creatorId.toString() !== userId) throw new LearntenAPIError("You are not the creator of this deck.", 403);
  return deck;
}