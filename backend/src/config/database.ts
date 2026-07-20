import { MongoClient, Db} from "mongodb";

let client: MongoClient;
let database: Db;

async function _connectToDatabase(): Promise<Db> {
  // Return existing connection if already established
  // This prevents creating multiple connections unnecessarily
  if (database) {
    return database;
  }

  // Retrieve MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. Please check your .env file and ensure it contains a valid MongoDB connection string."
    );
  }

  try {
    // Create new MongoDB client instance
    client = new MongoClient(uri, {
      // Set application name
      appName: "learntern",
    });

    // Connect to MongoDB
    await client.connect();

    // Get reference to the sample_mflix database
    database = client.db("sample_mflix");

    return database;
  } catch (error) {
    throw error;
  }
}

let connect$: Promise<Db>;
/**
 * Establishes connection to MongoDB by using the connection string from environment variables
 *
 * @returns Promise<Db> - The connected database instance
 * @throws Error if connection fails or if MONGODB_URI is not provided
 */
export async function connectToDatabase(): Promise<Db> {
  // connect$ only gets assigned exactly once on the first request, ensuring all subsequent requests use the same connect$ promise.
  connect$ ??= _connectToDatabase();
  return await connect$;
}