import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDatabase } from "../config/database.js";
import { UserDocument } from "./types.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

export class AuthError extends Error {}

function getUsersCollection() {
  return getDatabase().collection<UserDocument>("users");
}

function signToken(userId: unknown): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined.");
  }
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ token: string }> {
  const users = getUsersCollection();

  const existing = await users.findOne({
    $or: [{ email }, { username }],
  });
  if (existing) {
    throw new AuthError("Email or username is already taken");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await users.insertOne({
    email,
    username,
    passwordHash,
    createdAt: new Date(),
  });

  return { token: signToken(result.insertedId) };
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const users = getUsersCollection();

  const user = await users.findOne({ email });
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthError("Invalid email or password");
  }

  return { token: signToken(user._id) };
}
