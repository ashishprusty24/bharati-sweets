/**
 * Migration Script: clean-ledger-cc-items.js
 * 
 * Cleans up any CC Loan and Credit Card entries mistakenly saved into DailyLedger.items.
 * Recalculates totalExpenses, cashSales, and digitalSales for cleaned records.
 * 
 * Usage:
 *   node clean-ledger-cc-items.js               (cleans the default DB in .env)
 *   node clean-ledger-cc-items.js --prod        (cleans bharati_sweets_prod)
 *   node clean-ledger-cc-items.js --all         (cleans both QA and Prod)
 *   node clean-ledger-cc-items.js --dry-run     (preview changes without saving)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const isCCExpenseItem = (item) => {
  const cat = String(item.category || "").toLowerCase().trim();
  const desc = String(item.description || "").toLowerCase().trim();
  const src = String(item.paymentSource || "").toLowerCase().trim();
  return (
    src === "cc_loan" ||
    src === "credit_card" ||
    cat === "cc_loan" ||
    cat === "cc_loan_repayment" ||
    cat === "credit_card_bill" ||
    desc.startsWith("cc loan:") ||
    desc.startsWith("cc loan -")
  );
};

async function cleanDatabase(dbName, isDryRun) {
  const baseUri = process.env.MONGO_URI;
  const uri = baseUri.includes("/bharati_sweets")
    ? baseUri.replace(/\/bharati_sweets(_prod)?/, `/${dbName}`)
    : baseUri;

  console.log(`\n======================================================`);
  console.log(`Processing Database: ${dbName} ${isDryRun ? "[DRY RUN]" : "[LIVE UPDATE]"}`);
  console.log(`======================================================`);

  const conn = await mongoose.createConnection(uri).asPromise();
  const DailyLedger = conn.model("DailyLedger", new mongoose.Schema({}, { strict: false }));

  const ledgers = await DailyLedger.find();
  console.log(`Total DailyLedger documents found: ${ledgers.length}`);

  let cleanedLedgersCount = 0;
  let totalRemovedItemsCount = 0;
  let totalRemovedAmount = 0;

  for (const ledger of ledgers) {
    const items = ledger.items || [];
    const ccItems = items.filter(isCCExpenseItem);

    if (ccItems.length > 0) {
      cleanedLedgersCount++;
      totalRemovedItemsCount += ccItems.length;

      const dateStr = ledger.date ? new Date(ledger.date).toISOString().split("T")[0] : "Unknown";
      console.log(`\nLedger on ${dateStr} (ID: ${ledger._id}):`);
      ccItems.forEach((ci) => {
        const amt = Number(ci.amount) || 0;
        totalRemovedAmount += amt;
        console.log(`  - Removing CC Item: "${ci.description}" | Amt: ₹${amt} | Mode: ${ci.paymentMode}`);
      });

      const sanitizedItems = items.filter((item) => !isCCExpenseItem(item));

      // Recalculate totals
      const cashExpenseTotal = sanitizedItems
        .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankExpenseTotal = sanitizedItems
        .filter((i) => i.type === "expense" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const cashIncomeTotal = sanitizedItems
        .filter((i) => i.type === "income" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankIncomeTotal = sanitizedItems
        .filter((i) => i.type === "income" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const totalExpenses = cashExpenseTotal + bankExpenseTotal;

      const cashSales = Math.max(
        0,
        Number(ledger.closingBalance || 0) +
          cashExpenseTotal +
          Number(ledger.cashToHome || 0) -
          Number(ledger.openingBalance || 0) -
          Number(ledger.otherIncome || 0) -
          cashIncomeTotal
      );

      const digitalSales = Math.max(
        0,
        Number(ledger.closingBankBalance || 0) +
          bankExpenseTotal +
          Number(ledger.digitalToHome || 0) -
          Number(ledger.openingBankBalance || 0) -
          bankIncomeTotal
      );

      if (!isDryRun) {
        ledger.items = sanitizedItems;
        ledger.totalExpenses = totalExpenses;
        ledger.cashSales = cashSales;
        ledger.digitalSales = digitalSales;
        await ledger.save();
        console.log(`  -> Saved updated ledger. New totalExpenses: ₹${totalExpenses}`);
      } else {
        console.log(`  -> [DRY RUN] Would update ledger. New totalExpenses: ₹${totalExpenses}`);
      }
    }
  }

  console.log(`\n--- Summary for ${dbName} ---`);
  console.log(`Ledgers checked: ${ledgers.length}`);
  console.log(`Ledgers with CC items: ${cleanedLedgersCount}`);
  console.log(`Total CC items removed: ${totalRemovedItemsCount}`);
  console.log(`Total CC amount sanitized: ₹${totalRemovedAmount.toLocaleString("en-IN")}`);

  await conn.close();
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isProd = args.includes("--prod");
  const isAll = args.includes("--all");

  try {
    if (isAll) {
      await cleanDatabase("bharati_sweets", isDryRun);
      await cleanDatabase("bharati_sweets_prod", isDryRun);
    } else if (isProd) {
      await cleanDatabase("bharati_sweets_prod", isDryRun);
    } else {
      await cleanDatabase("bharati_sweets", isDryRun);
    }
    console.log("\nMigration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

main();
