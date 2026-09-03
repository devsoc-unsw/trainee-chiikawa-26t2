const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface Deck {
  _id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  creatorId: string;
  cardCount: number;
  isCreator: boolean;
}

export interface Card {
  _id: string;
  deckId: string;
  front: string;
  back: string;
  order: number;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api${path}`, { credentials: "include" });
  if (!res.ok) {
    throw new ApiError(res.status, `Request failed: ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getDeck(deckId: string): Promise<Deck> {
  return request<Deck>(`/decks/${deckId}`);
}

export function getDeckCards(deckId: string): Promise<Card[]> {
  return request<Card[]>(`/decks/${deckId}/cards`);
}
