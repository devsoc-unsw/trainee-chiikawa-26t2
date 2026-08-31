import "express";
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
      };
    }
  }
}