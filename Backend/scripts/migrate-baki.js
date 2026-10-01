const mongoose = require("mongoose");
require("dotenv").config({ path: "Backend/.env" });
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/bharati-sweets";

async function runMigration() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB.");

  const customerCreditController = require("../controllers/customerCreditController");
  
  console.log("🚀 Starting migration of unpaid Event Orders from 2026-09-01 onwards into Customer Credit (Bakki)...");
  const result = await customerCreditController.syncEventOrdersToBakki("2026-09-01");
  
  console.log("\n================ MIGRATION REPORT ================");
  console.log(`📅 Cutoff Date: ${result.cutoffDate}`);
  console.log(`📦 Total Event Orders Scanned: ${result.totalOrdersScanned}`);
  console.log(`👥 Unpaid Orders Synced to Bakki: ${result.unpaidOrdersSynced}`);
  console.log(`💰 Total Outstanding Dues: ₹${result.totalDueAmount.toLocaleString()}`);
  console.log("--------------------------------------------------");
  result.migratedDetails.forEach((d, idx) => {
    console.log(`${idx + 1}. ${d.customerName} (${d.phone || "No phone"}): Total ₹${d.totalAmount}, Paid ₹${d.paidAmount}, Due ₹${d.balance}, Date: ${d.deliveryDate?.toISOString()?.slice(0, 10)}`);
  });
  console.log("==================================================\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB. Migration completed successfully!");
}

runMigration().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
