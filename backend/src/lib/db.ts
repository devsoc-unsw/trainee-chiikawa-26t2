import mongoose from "mongoose";

const clientOptions = { serverApi: { version: '1' as const, strict: true, deprecationErrors: true } };
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(process.env.DB_URL!, clientOptions);
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not available");
    await db.admin().command({ ping: 1 });
    console.log("Pinged deployment. Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await mongoose.disconnect();
  }
  return mongoose.connection;
}
