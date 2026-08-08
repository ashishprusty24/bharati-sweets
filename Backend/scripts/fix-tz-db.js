require("dotenv").config();
const mongoose = require("mongoose");
const dayjs = require("dayjs");

async function fixTimezoneDuplicates() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Delete duplicate/erroneous ledgers and intake docs created with UTC offset shift
  await db.collection("dailyledgers").deleteMany({ date: new Date("2026-08-07T18:30:00.000Z") });
  await db.collection("homeexpenses").deleteMany({ date: new Date("2026-08-07T18:30:00.000Z") });

  // 2. Normalize 7th Aug ledger & intake
  const aug7 = new Date("2026-08-07T00:00:00.000Z");
  await db.collection("dailyledgers").updateOne(
    { date: aug7 },
    { $set: { cashToHome: 10000, digitalToHome: 27000 } },
    { upsert: true }
  );

  await db.collection("homeexpenses").deleteMany({ category: "home_intake" });
  await db.collection("homeexpenses").insertOne({
    date: aug7,
    description: "Cash taken home from shop",
    amount: 10000,
    category: "home_intake",
    paymentSource: "home_cash",
    sourceTag: "direct",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await db.collection("homeexpenses").insertOne({
    date: aug7,
    description: "Digital funds transferred to home",
    amount: 27000,
    category: "home_intake",
    paymentSource: "bank_account",
    sourceTag: "direct",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 3. Normalize 8th Aug ledger
  const aug8 = new Date("2026-08-08T00:00:00.000Z");
  await db.collection("dailyledgers").updateOne(
    { date: aug8 },
    { $set: { cashToHome: 0, digitalToHome: 0 } },
    { upsert: true }
  );

  console.log("Successfully normalized 7th Aug & 8th Aug DB records!");
  process.exit(0);
}

fixTimezoneDuplicates().catch(err => { console.error(err); process.exit(1); });
