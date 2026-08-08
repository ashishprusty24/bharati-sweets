require("dotenv").config();
const mongoose = require("mongoose");

async function inspectLedgerFestivals() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const docs = await db.collection("dailyledgers").find({}).toArray();
  console.log("Total dailyledgers docs:", docs.length);
  docs.forEach((d) => {
    console.log("Date:", d.date, "| Festival:", JSON.stringify(d.festival), "| Sweets:", d.sweetProduction ? d.sweetProduction.length : 0);
  });
  process.exit(0);
}
inspectLedgerFestivals().catch((err) => { console.error(err); process.exit(1); });
