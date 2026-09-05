import mongoose from "mongoose";
import { LearntenAPIError } from "../utils/errors.js";

/**
 * Read-only lookups against Better Auth's own "user" collection (managed by
 * its MongoDB adapter, in the same database as our Mongoose models — see
 * lib/auth.ts). We never write to this collection here; identity fields
 * (name/email/image) are owned entirely by Better Auth.
 */
export interface AuthUserSummary {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

const USER_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function getUserCollection() {
  const db = mongoose.connection.db;
  if (!db) throw new LearntenAPIError("Database is not connected yet.", 503);
  return db.collection("user");
}

function toSummary(doc: any): AuthUserSummary {
  return {
    id: doc._id.toString(),
    name: doc.name ?? "",
    email: doc.email ?? "",
    image: doc.image ?? null,
  };
}

export function looksLikeUserId(value: string): boolean {
  return USER_ID_REGEX.test(value);
}

export async function findAuthUserById(userId: string): Promise<AuthUserSummary | null> {
  if (!looksLikeUserId(userId)) return null;
  const doc = await getUserCollection().findOne({ _id: new mongoose.Types.ObjectId(userId) });
  return doc ? toSummary(doc) : null;
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserSummary | null> {
  const doc = await getUserCollection().findOne({ email: email.toLowerCase() });
  return doc ? toSummary(doc) : null;
}

/** Resolves a user by whichever exact identifier they typed: a user ID or an email. */
export async function findAuthUserByIdentifier(identifier: string): Promise<AuthUserSummary | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (looksLikeUserId(trimmed)) {
    const byId = await findAuthUserById(trimmed);
    if (byId) return byId;
  }
  return findAuthUserByEmail(trimmed);
}

export async function findAuthUsersByIds(userIds: string[]): Promise<Map<string, AuthUserSummary>> {
  const validIds = [...new Set(userIds.filter(looksLikeUserId))];
  const map = new Map<string, AuthUserSummary>();
  if (validIds.length === 0) return map;

  const docs = await getUserCollection()
    .find({ _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) } })
    .toArray();

  for (const doc of docs) {
    const summary = toSummary(doc);
    map.set(summary.id, summary);
  }
  return map;
}
