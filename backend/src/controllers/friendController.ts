import { Request, Response } from "express";
import * as friendService from "../services/friendService.js";
import { errorHandler } from "../utils/errors.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function listFriends(req: Request, res: Response) {
  try {
    const friends = await friendService.listFriends(req.user!.id);
    res.json(friends);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function listRequests(req: Request, res: Response) {
  try {
    const [incoming, outgoing] = await Promise.all([
      friendService.listIncomingRequests(req.user!.id),
      friendService.listOutgoingRequests(req.user!.id),
    ]);
    res.json({ incoming, outgoing });
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function sendRequest(req: Request, res: Response) {
  try {
    const { identifier } = req.body ?? {};
    if (!isNonEmptyString(identifier)) {
      return res.status(400).json({ error: "identifier (user ID or email) is required." });
    }
    const result = await friendService.sendFriendRequest(req.user!.id, identifier);
    res.status(201).json(result);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function acceptRequest(req: Request, res: Response) {
  try {
    const request = await friendService.acceptFriendRequest(req.user!.id, req.params.requestId as string);
    res.json(request);
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function removeRequest(req: Request, res: Response) {
  try {
    await friendService.removeFriendRequest(req.user!.id, req.params.requestId as string);
    res.status(204).end();
  } catch (e) {
    errorHandler(e, req, res);
  }
}

export async function removeFriend(req: Request, res: Response) {
  try {
    await friendService.removeFriend(req.user!.id, req.params.friendUserId as string);
    res.status(204).end();
  } catch (e) {
    errorHandler(e, req, res);
  }
}
