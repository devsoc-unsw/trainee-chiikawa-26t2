const BASE_URL = import.meta.env.VITE_BACKEND_URL;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body, fall back to statusText
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Deck {
  _id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  creatorId: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  deckId: string;
  front: string;
  back: string;
  order: number;
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  isPublic: boolean;
}

export interface AddCardInput {
  front: string;
  back: string;
}

// POST /api/decks
export function createDeck(data: CreateDeckInput) {
  return request<Deck>("/api/decks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// GET /api/decks/mine - every deck owned by the signed-in user
export function listMyDecks() {
  return request<Deck[]>("/api/decks/mine");
}

// GET /api/decks/:deckId
export function getDeck(deckId: string) {
  return request<Deck & { isCreator: boolean }>(`/api/decks/${deckId}`);
}

// GET /api/decks/:deckId/cards
export function getDeckCards(deckId: string) {
  return request<Card[]>(`/api/decks/${deckId}/cards`);
}

// PUT /api/decks/:deckId
export function updateDeck(deckId: string, updates: Partial<CreateDeckInput>) {
  return request<Deck>(`/api/decks/${deckId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// DELETE /api/decks/:deckId
export function deleteDeck(deckId: string) {
  return request<void>(`/api/decks/${deckId}`, { method: "DELETE" });
}

// POST /api/decks/:deckId/cards
export function addCard(deckId: string, data: AddCardInput) {
  return request<Card>(`/api/decks/${deckId}/cards`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT /api/decks/:deckId/cards/:cardId
export function updateCard(deckId: string, cardId: string, updates: Partial<AddCardInput>) {
  return request<Card>(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// DELETE /api/decks/:deckId/cards/:cardId
export function deleteCard(deckId: string, cardId: string) {
  return request<void>(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" });
}

export { ApiError };
