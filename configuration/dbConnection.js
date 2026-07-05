const mongoose = require("mongoose");

const LOCAL_MONGO = "mongodb://127.0.0.1:27017/backend-auth";

async function dbConnection() {
  const url = process.env.MONGODB_URL || LOCAL_MONGO;

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Database connected:", url);
    return;
  } catch (error) {
    const canUseMemoryDb =
      process.env.NODE_ENV !== "production" && process.env.MONGODB_USE_MEMORY !== "false";

    if (!canUseMemoryDb) {
      console.error("\nDatabase connection failed:", error.message);
      console.error("Check MONGODB_URL in .env and ensure MongoDB is running.\n");
      process.exit(1);
    }

    console.warn("\nLocal MongoDB is not running. Starting in-memory database for development...");

    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const memoryServer = await MongoMemoryServer.create();
      const memoryUrl = memoryServer.getUri();

      await mongoose.connect(memoryUrl);
      console.log("Database connected (in-memory dev mode)");
      console.log("Tip: install MongoDB locally or set MONGODB_URL to MongoDB Atlas for persistent data.\n");
    } catch (memoryError) {
      console.error("\nDatabase connection failed:", memoryError.message);
      console.error("Install MongoDB or set a valid MONGODB_URL in .env.\n");
      process.exit(1);
    }
  }
}

module.exports = dbConnection;
