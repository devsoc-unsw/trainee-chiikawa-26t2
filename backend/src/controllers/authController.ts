import { Request, Response } from "express";
import { AuthError, login, register } from "../services/authService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function registerController(req: Request, res: Response) {
  const { email, username, password } = req.body ?? {};

  if (
    !isNonEmptyString(email) ||
    !isNonEmptyString(username) ||
    !isNonEmptyString(password)
  ) {
    return res
      .status(400)
      .json({ error: "email, username and password are required" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const { token } = await register(email, username, password);
    return res.status(201).json({ token });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const { token } = await login(email, password);
    return res.status(200).json({ token });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
