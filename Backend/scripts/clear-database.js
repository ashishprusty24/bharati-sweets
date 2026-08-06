const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const clearDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      "mongodb+srv://mongodb:mongodb@cluster0.pnj2fjf.mongodb.net/bharati_sweets";

    console.log(`📡 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);

    console.log(` Connected to DB: ${mongoose.connection.name}`);

    const collections = await mongoose.connection.db.collections();

    if (collections.length === 0) {
      console.log("ℹ️ No collections found to clear.");
    } else {
      for (let collection of collections) {
        const name = collection.collectionName;
        await collection.deleteMany({});
        console.log(`🧹 Cleared all documents from collection: [${name}]`);
      }
    }

    console.log(" All database collections emptied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
};

clearDatabase();
