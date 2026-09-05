import { FriendRequest, FRIEND_REQUEST_STATUS } from "../models/FriendRequest.js";
import { UserProfile } from "../models/UserProfile.js";
import { LearntenAPIError } from "../utils/errors.js";
import {
  findAuthUserByIdentifier,
  findAuthUsersByIds,
} from "../lib/authUsers.js";

function otherPartyId(request: { requesterId: string; recipientId: string }, userId: string) {
  return request.requesterId === userId ? request.recipientId : request.requesterId;
}

function findRelationship(userIdA: string, userIdB: string) {
  return FriendRequest.findOne({
    $or: [
      { requesterId: userIdA, recipientId: userIdB },
      { requesterId: userIdB, recipientId: userIdA },
    ],
  });
}


export async function sendFriendRequest(userId: string, identifier: string) {
  const target = await findAuthUserByIdentifier(identifier);
  if (!target) throw new LearntenAPIError("No user found with that ID or email.", 404);
  if (target.id === userId) throw new LearntenAPIError("You can't friend yourself.", 400);

  const existing = await findRelationship(userId, target.id);

  if (existing) {
    if (existing.status === FRIEND_REQUEST_STATUS.ACCEPTED) {
      throw new LearntenAPIError("You're already friends with this user.", 409);
    }
    if (existing.requesterId === userId) {
      throw new LearntenAPIError("You've already sent this user a friend request.", 409);
    }
    // They'd already requested us — accept instead of creating a duplicate.
    existing.status = FRIEND_REQUEST_STATUS.ACCEPTED;
    await existing.save();
    return { request: existing.toObject(), autoAccepted: true };
  }

  const request = await FriendRequest.create({
    requesterId: userId,
    recipientId: target.id,
    status: FRIEND_REQUEST_STATUS.PENDING,
  });
  return { request: request.toObject(), autoAccepted: false };
}

export async function acceptFriendRequest(userId: string, requestId: string) {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new LearntenAPIError("Friend request not found.", 404);
  if (request.recipientId !== userId) {
    throw new LearntenAPIError("This request isn't addressed to you.", 403);
  }
  if (request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw new LearntenAPIError("This request has already been handled.", 409);
  }
  request.status = FRIEND_REQUEST_STATUS.ACCEPTED;
  await request.save();
  return request.toObject();
}

/** Declines an incoming request, or cancels one you sent — either way, removes it. */
export async function removeFriendRequest(userId: string, requestId: string) {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new LearntenAPIError("Friend request not found.", 404);
  if (request.requesterId !== userId && request.recipientId !== userId) {
    throw new LearntenAPIError("This request isn't yours to remove.", 403);
  }
  if (request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw new LearntenAPIError(
      "This request has already been accepted — remove them as a friend instead.",
      409,
    );
  }
  await request.deleteOne();
}

export async function removeFriend(userId: string, friendUserId: string) {
  const relationship = await findRelationship(userId, friendUserId);
  if (!relationship || relationship.status !== FRIEND_REQUEST_STATUS.ACCEPTED) {
    throw new LearntenAPIError("You're not friends with this user.", 404);
  }
  await relationship.deleteOne();
}

interface CounterpartEntry {
  requestId: string;
  counterpartId: string;
  createdAt: Date;
}

async function summarizeCounterparts(entries: CounterpartEntry[]) {
  const ids = entries.map((e) => e.counterpartId);
  const [authUsers, profiles] = await Promise.all([
    findAuthUsersByIds(ids),
    UserProfile.find({ userId: { $in: ids } }).lean(),
  ]);
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

  return entries.map((entry) => {
    const user = authUsers.get(entry.counterpartId);
    const profile = profileByUserId.get(entry.counterpartId);
    return {
      requestId: entry.requestId,
      userId: entry.counterpartId,
      name: user?.name || "Unknown user",
      avatar: user?.image || "/defaultProfile.png",
      reviewStreak: profile?.reviewStreak ?? 0,
      cardsReviewedToday: profile?.totalCardsReviewedToday ?? 0,
      createdAt: entry.createdAt,
    };
  });
}

export async function listFriends(userId: string) {
  const accepted = await FriendRequest.find({
    status: FRIEND_REQUEST_STATUS.ACCEPTED,
    $or: [{ requesterId: userId }, { recipientId: userId }],
  }).lean();

  const entries: CounterpartEntry[] = accepted.map((r) => ({
    requestId: r._id.toString(),
    counterpartId: otherPartyId(r, userId),
    createdAt: r.updatedAt ?? r.createdAt,
  }));

  return summarizeCounterparts(entries);
}

export async function listIncomingRequests(userId: string) {
  const pending = await FriendRequest.find({
    status: FRIEND_REQUEST_STATUS.PENDING,
    recipientId: userId,
  }).lean();

  const entries: CounterpartEntry[] = pending.map((r) => ({
    requestId: r._id.toString(),
    counterpartId: r.requesterId,
    createdAt: r.createdAt,
  }));

  return summarizeCounterparts(entries);
}

export async function listOutgoingRequests(userId: string) {
  const pending = await FriendRequest.find({
    status: FRIEND_REQUEST_STATUS.PENDING,
    requesterId: userId,
  }).lean();

  const entries: CounterpartEntry[] = pending.map((r) => ({
    requestId: r._id.toString(),
    counterpartId: r.recipientId,
    createdAt: r.createdAt,
  }));

  return summarizeCounterparts(entries);
}
