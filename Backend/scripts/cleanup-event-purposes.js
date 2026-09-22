require("dotenv").config();
const mongoose = require("mongoose");

const normalizePurpose = (str = "") => {
  if (!str) return "Other Celebration";
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();
  if (/vishwakarma|viswakarama|biswakarma|viswakarma|viswkarma/i.test(lower)) return "Vishwakarma Puja";
  if (/diwali|duwali|deepavali/i.test(lower)) return "Diwali";
  if (/ganesh|ganapati/i.test(lower)) return "Ganesh Puja";
  if (/durga|dussehra|dashami|vijayadashami/i.test(lower)) return "Durga Puja";
  if (/laxmi|lakshmi/i.test(lower)) return "Laxmi Puja";
  if (/saraswati/i.test(lower)) return "Saraswati Puja";
  if (/janmashtami/i.test(lower)) return "Janmashtami";
  if (/rakhi|raksha/i.test(lower)) return "Raksha Bandhan";
  if (/marriage|wedding/i.test(lower)) return "Marriage";
  if (/reception/i.test(lower)) return "Reception";
  if (/engagement|ring/i.test(lower)) return "Engagement / Ring Ceremony";
  if (/birthday/i.test(lower)) return "Birthday Party";
  if (/anniversary/i.test(lower)) return "Anniversary";
  if (/thread|upanayana|brata/i.test(lower)) return "Thread Ceremony (Upanayana)";
  if (/baby shower|sadh/i.test(lower)) return "Baby Shower (Sadh)";
  if (/corporate/i.test(lower)) return "Corporate Event";
  if (/safety week/i.test(lower)) return "Safety Week";
  if (/municipality/i.test(lower)) return "Municipality Function";
  return trimmed;
};

async function cleanupEventPurposes() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection("eventorders");

  const orders = await collection.find({}).toArray();
  console.log(`Found ${orders.length} total event orders.`);

  let updatedCount = 0;

  for (const order of orders) {
    const rawPurpose = order.purpose || "";
    const cleanPurpose = normalizePurpose(rawPurpose);

    if (rawPurpose !== cleanPurpose) {
      await collection.updateOne(
        { _id: order._id },
        { $set: { purpose: cleanPurpose } }
      );
      console.log(`Updated Order #${order._id}: "${rawPurpose}" -> "${cleanPurpose}"`);
      updatedCount++;
    }
  }

  console.log(`Migration complete! Updated ${updatedCount} orders.`);

  const distinctPurposes = await collection.distinct("purpose");
  console.log("Distinct purposes now in DB:", distinctPurposes);

  process.exit(0);
}

cleanupEventPurposes().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
