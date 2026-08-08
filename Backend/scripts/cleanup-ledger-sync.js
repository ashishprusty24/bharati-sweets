/**
 * ONE-TIME CLEANUP SCRIPT
 * Scans all DailyLedger items and marks matching HomeExpense records
 * as sourceTag: "daily_ledger" so they are hidden from the Home Expenses page.
 *
 * Run: node scripts/cleanup-ledger-sync.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const dayjs = require("dayjs");

const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");

async function cleanup() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error("ERROR: No MongoDB URI found in .env (tried MONGODB_URI, MONGO_URI, DATABASE_URL)");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected!\n");

  const ledgers = await DailyLedger.find({});
  console.log(`Found ${ledgers.length} Daily Ledger records to scan.\n`);

  let markedCount = 0;
  let alreadyTaggedCount = 0;

  for (const ledger of ledgers) {
    const targetDate = dayjs(ledger.date).startOf("day").toDate();
    const endOfDay = dayjs(ledger.date).endOf("day").toDate();
    const items = ledger.items || [];

    for (const item of items) {
      if (!item.description || !item.amount) continue;

      const escaped = item.description.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const matches = await HomeExpense.find({
        date: { $gte: targetDate, $lte: endOfDay },
        description: new RegExp("^" + escaped + "$", "i"),
        amount: Number(item.amount),
      });

      for (const exp of matches) {
        if (exp.sourceTag === "daily_ledger") {
          alreadyTaggedCount++;
        } else {
          await HomeExpense.findByIdAndUpdate(exp._id, {
            sourceTag: "daily_ledger",
            ledgerItemId: exp.ledgerItemId || String(item._id),
          });
          console.log(
            `  [TAGGED] ${dayjs(ledger.date).format("DD MMM YYYY")} — ${exp.description} — ₹${exp.amount} (was: ${exp.sourceTag || "direct"})`
          );
          markedCount++;
        }
      }
    }
  }

  console.log("\n────────────────────────────────");
  console.log(`✅  Marked as daily_ledger:  ${markedCount}`);
  console.log(`⏭   Already tagged:          ${alreadyTaggedCount}`);
  console.log("────────────────────────────────");
  console.log("Done! Refresh the Home Expenses page to see the clean data.\n");

  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
