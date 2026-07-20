import "dotenv/config";
import express from "express"
import { connectToDatabase } from "./config/database.js";

const PORT = process.env.PORT ?? 3000;

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(PORT, () => {
      console.log(`listening at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();