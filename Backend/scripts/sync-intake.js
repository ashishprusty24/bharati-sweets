require("dotenv").config();
const mongoose = require("mongoose");
const dayjs = require("dayjs");

async function syncIntake() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const ledgerColl = db.collection("dailyledgers");
  const homeExpColl = db.collection("homeexpenses");

  const ledgers = await ledgerColl.find({}).toArray();
  for (const ledger of ledgers) {
    const targetDate = dayjs(ledger.date).startOf("day").toDate();
    const endOfDay   = dayjs(ledger.date).endOf("day").toDate();

    if (ledger.cashToHome > 0) {
      await homeExpColl.updateOne(
        { date: { $gte: targetDate, $lte: endOfDay }, category: "home_intake", paymentSource: "home_cash" },
        { $set: { date: targetDate, description: "Cash taken home from shop", amount: Number(ledger.cashToHome), category: "home_intake", paymentSource: "home_cash", sourceTag: "direct" } },
        { upsert: true }
      );
      console.log(`Synced cashToHome ₹${ledger.cashToHome} for ${dayjs(ledger.date).format("DD MMM YYYY")}`);
    }

    if (ledger.digitalToHome > 0) {
      await homeExpColl.updateOne(
        { date: { $gte: targetDate, $lte: endOfDay }, category: "home_intake", paymentSource: "bank_account" },
        { $set: { date: targetDate, description: "Digital funds transferred to home", amount: Number(ledger.digitalToHome), category: "home_intake", paymentSource: "bank_account", sourceTag: "direct" } },
        { upsert: true }
      );
      console.log(`Synced digitalToHome ₹${ledger.digitalToHome} for ${dayjs(ledger.date).format("DD MMM YYYY")}`);
    }
  }

  process.exit(0);
}

syncIntake().catch(err => { console.error(err); process.exit(1); });
