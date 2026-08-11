const mongoose = require("mongoose");
const dayjs = require("dayjs");
require("dotenv").config();

const { getLedgerByDate, saveLedger } = require("../controllers/ledgerController");
const DailyLedger = require("../models/DailyLedger");

async function runTest() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bharati-sweets";
  console.log("Connecting to Mongo:", mongoUri);
  await mongoose.connect(mongoUri);

  const testDay1 = "2026-08-01";
  const testDay2 = "2026-08-02";

  console.log("\n--- TEST STEP 1: Saving Day 1 Closing Balance (Cash: 15000, Bank: 7000) ---");
  await saveLedger(testDay1, {
    openingBalance: 5000,
    openingBankBalance: 2000,
    closingBalance: 15000,
    closingBankBalance: 7000,
    items: [],
  });

  console.log("Day 1 saved.");

  console.log("\n--- TEST STEP 2: Fetching Day 2 Ledger ---");
  const day2Ledger = await getLedgerByDate(testDay2);
  console.log("Day 2 Opening Cash Balance:", day2Ledger.openingBalance);
  console.log("Day 2 Opening Bank Balance:", day2Ledger.openingBankBalance);

  if (day2Ledger.openingBalance === 15000 && day2Ledger.openingBankBalance === 7000) {
    console.log("SUCCESS: Day 2 Opening balance auto-synced from Day 1 Closing balance!");
  } else {
    console.error("FAIL: Day 2 Opening balance did NOT match Day 1 Closing balance!");
  }

  console.log("\n--- TEST STEP 3: Updating Day 1 Closing Balance (Cash: 18000, Bank: 9000) ---");
  await saveLedger(testDay1, {
    openingBalance: 5000,
    openingBankBalance: 2000,
    closingBalance: 18000,
    closingBankBalance: 9000,
    items: [],
  });

  console.log("\n--- TEST STEP 4: Re-fetching Day 2 Ledger ---");
  const day2LedgerUpdated = await getLedgerByDate(testDay2);
  console.log("Day 2 Updated Opening Cash Balance:", day2LedgerUpdated.openingBalance);
  console.log("Day 2 Updated Opening Bank Balance:", day2LedgerUpdated.openingBankBalance);

  if (day2LedgerUpdated.openingBalance === 18000 && day2LedgerUpdated.openingBankBalance === 9000) {
    console.log("SUCCESS: Day 2 Opening balance automatically updated after Day 1 was edited!");
  } else {
    console.error("FAIL: Day 2 Opening balance did NOT update!");
  }

  await mongoose.disconnect();
  console.log("\nTest Completed successfully.");
}

runTest().catch((err) => {
  console.error("Test Error:", err);
  mongoose.disconnect();
});
