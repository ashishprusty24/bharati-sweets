require("dotenv").config();
const mongoose = require("mongoose");

async function seedFestivalDemo() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 2025 Rakhi Purnima
  const aug2025 = new Date("2025-08-09T00:00:00.000Z");
  await db.collection("dailyledgers").updateOne(
    { date: aug2025 },
    {
      $set: {
        date: aug2025,
        festival: "Rakhi Purnima",
        openingBalance: 5000,
        closingBalance: 140000,
        cashSales: 135000,
        digitalSales: 10000,
        sweetProduction: [
          { sweetName: "Rasgolla", quantity: 50, unit: "ghan", actualSold: 50, notes: "Sold out early! Shortage experienced." },
          { sweetName: "Gulab Jamun", quantity: 40, unit: "ghan", actualSold: 25, notes: "15 Ghan surplus remaining." }
        ]
      }
    },
    { upsert: true }
  );

  // 2026 Rakhi Purnima
  const aug2026 = new Date("2026-08-08T00:00:00.000Z");
  await db.collection("dailyledgers").updateOne(
    { date: aug2026 },
    {
      $set: {
        festival: "Rakhi Purnima",
        sweetProduction: [
          { sweetName: "Rasgolla", quantity: 60, unit: "ghan", actualSold: 58, notes: "Increased by 10 Ghan as planned. Perfect match!" },
          { sweetName: "Gulab Jamun", quantity: 30, unit: "ghan", actualSold: 29, notes: "Decreased to 30 Ghan as planned. Perfect match!" }
        ]
      }
    }
  );

  console.log("Seeded YoY demo records for Rakhi Purnima (2025 & 2026)!");
  process.exit(0);
}

seedFestivalDemo().catch(err => { console.error(err); process.exit(1); });
