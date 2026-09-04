import { Card } from "../models/Card.js";
import { Deck } from "../models/Deck.js";
import { LearntenAPIError } from "../utils/errors.js";

/**
 * Browse public decks with optional search query and tag filtering.
 */
export async function browsePublicDecks(
  query?: string,
  tags?: string[],
  page = 1,
  limit = 20,
) {
  const filter: Record<string, unknown> = { isPublic: true };

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;
  const [decks, total] = await Promise.all([
    Deck.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Deck.countDocuments(filter),
  ]);

  return {
    decks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Clone a public deck (and all its cards) into a user's library.
 */
export async function cloneDeck(userId: string, deckId: string) {
  const sourceDeck = await Deck.findById(deckId).lean();
  if (!sourceDeck) throw new LearntenAPIError("Could not find deck.", 404);
  if (!sourceDeck.isPublic) throw new LearntenAPIError("Deck is not public.", 403);

  // Create the cloned deck under the user's account
  const clonedDeck = await Deck.create({
    title: sourceDeck.title,
    description: sourceDeck.description,
    tags: sourceDeck.tags,
    isPublic: false,
    creatorId: userId,
    cardCount: sourceDeck.cardCount,
  });

  // Clone all cards from the source deck
  const sourceCards = await Card.find({ deckId: sourceDeck._id }).lean();
  if (sourceCards.length > 0) {
    const clonedCards = sourceCards.map((card) => ({
      deckId: clonedDeck._id,
      front: card.front,
      back: card.back,
      order: card.order,
    }));
    await Card.insertMany(clonedCards);
  }

  return clonedDeck;
}

/**
 * Toggle favorite on a deck for a user.
 * Returns whether the deck is now favorited.
 */
export async function favoriteDeck(userId: string, deckId: string) {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new LearntenAPIError("Could not find deck.", 404);

  const index = deck.favoritedBy.findIndex((id) => id.toString() === userId);
  if (index === -1) {
    deck.favoritedBy.push(userId as any);
  } else {
    deck.favoritedBy.splice(index, 1);
  }
  await deck.save();

  return { isFavorited: index === -1 };
}

/**
 * Get all decks favorited by a user.
 */
export async function getUserFavorites(userId: string) {
  return Deck.find({ favoritedBy: userId })
    .sort({ createdAt: -1 })
    .lean();
}
