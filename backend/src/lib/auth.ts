import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuth } from "better-auth/minimal";
import { connectDb } from "./db.js";

const mongooseInstance = await connectDb();
const client = mongooseInstance.getClient();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(client.db(), { client }),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }
  },
  trustedOrigins: [process.env.FRONTEND_URL!],
  user: {
    additionalFields: {
      level: { type: "number", required: false, defaultValue: 1, input: false },
      xp: { type: "number", required: false, defaultValue: 0, input: false },
      xpMax: { type: "number", required: false, defaultValue: 100, input: false },
      cardsReviewed: { type: "number", required: false, defaultValue: 0, input: false },
      daysPassed: { type: "number", required: false, defaultValue: 0, input: false },
      refinedLanterns: { type: "number", required: false, defaultValue: 0, input: false },
      lanternsBuilt: { type: "number", required: false, defaultValue: 0, input: false },
      dailyStreak: { type: "number", required: false, defaultValue: 0, input: false },
    },
  },
});
