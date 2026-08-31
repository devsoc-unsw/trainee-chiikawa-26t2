import { Request, Response } from "express";

export class LearntenAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(e: unknown, req: Request, res: Response) {
  if (e instanceof LearntenAPIError) {
    return res.status(e.status).json({ error: e.message });
  }
  console.error(e);
  res.status(500).json({ error: "Internal server error" });
}