import "dotenv/config";
import express from "express"
import cors from "cors";
import { connectDb } from "./lib/db.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

import deckRoutes from "./routes/deckRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"
import shareRoutes from "./routes/shareRoutes.js"
import friendRoutes from "./routes/friendRoutes.js"

const PORT = process.env.PORT ?? 3000;

const app = express();
console.log("frontend url", process.env.FRONTEND_URL);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.use("/api/decks", deckRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/friends", friendRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});



app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}/`);
});

connectDb().catch(() => console.error("Could not connect to database"));