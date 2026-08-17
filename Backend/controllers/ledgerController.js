const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");
const Vendor = require("../models/Vendor");
const dayjs = require("dayjs");

const isIntakeCategory = (cat = "") => {
  const norm = String(cat).toLowerCase().trim();
  return (
    norm === "home_intake" ||
    norm === "home intake" ||
    norm === "personal" ||
    norm === "intake"
  );
};

const getLedgerByDate = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);


      let ledger = await DailyLedger.findOne({ date: targetDate });

      // Only count actual Home Intake entries — split cash vs bank
      // Do NOT include all home_cash expenses (would incorrectly include shop expenses)
      let cashHomeIntake = 0;
      let bankHomeIntake = 0;
      try {
        const homeIntakeExpenses = await HomeExpense.find({
          date: { $gte: targetDate, $lte: endOfDay },
          category: "home_intake",
        });
        cashHomeIntake = homeIntakeExpenses
          .filter((e) => e.paymentSource === "home_cash")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        bankHomeIntake = homeIntakeExpenses
          .filter((e) => e.paymentSource === "bank_account")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      } catch (hErr) {
        console.error("Error auto-fetching home intake:", hErr);
      }

      // Fetch previous day's ledger to auto-fill/sync opening balance
      const prevDay = dayjs(date).subtract(1, "day").startOf("day").toDate();
      const prevLedger = await DailyLedger.findOne({ date: prevDay });
      const prevClosingCash = prevLedger ? (Number(prevLedger.closingBalance) || 0) : 0;
      const prevClosingBank = prevLedger ? (Number(prevLedger.closingBankBalance) || 0) : 0;

      if (!ledger) {
        // New day — auto-fill opening from previous day's closing (physical count)
        ledger = new DailyLedger({
          date: targetDate,
          festival: "",
          sweetProduction: [],
          openingBalance: prevClosingCash,
          openingBankBalance: prevClosingBank,
          cashSales: 0,
          digitalSales: 0,
          totalExpenses: 0,
          otherIncome: 0,
          cashToHome: cashHomeIntake,
          digitalToHome: bankHomeIntake,
          closingBalance: 0,
          closingBankBalance: 0,
          items: [],
        });
      } else {
        // If previous day exists, auto-sync opening balance from previous day's closing balance
        if (prevLedger) {
          ledger.openingBalance = prevClosingCash;
          ledger.openingBankBalance = prevClosingBank;
        }
        // Auto-populate if not already set manually
        if (!ledger.cashToHome && cashHomeIntake > 0) ledger.cashToHome = cashHomeIntake;
        if (!ledger.digitalToHome && bankHomeIntake > 0) ledger.digitalToHome = bankHomeIntake;
      }

      // Compute derived sell from the formula:
      // Sell = ClosingBalance + Expenses + CashToHome - OpeningBalance - OtherIncome
      const ledgerObj = ledger.toObject ? ledger.toObject() : { ...ledger };
      const items = ledgerObj.items || [];

      // Merge Home Expenses into ledger items if missing
      try {
        const homeExpenses = await HomeExpense.find({
          date: { $gte: targetDate, $lte: endOfDay },
        });
        homeExpenses.forEach((exp) => {
          if (!isIntakeCategory(exp.category)) {
            const exists = items.some(
              (i) => i.description === exp.description && Number(i.amount) === Number(exp.amount)
            );
            if (!exists) {
              items.push({
                description: exp.description,
                amount: Number(exp.amount) || 0,
                type: "expense",
                category: exp.category,
                vendorId: exp.vendorId,
                paymentMode: exp.paymentSource === "bank_account" ? "bank" : "cash",
              });
            }
          }
        });
      } catch (eErr) {
        console.error("Error merging home expenses into ledger items:", eErr);
      }

      const cashExpenseTotal = items
        .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankExpenseTotal = items
        .filter((i) => i.type === "expense" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const cashIncomeTotal = items
        .filter((i) => i.type === "income" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankIncomeTotal = items
        .filter((i) => i.type === "income" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const totalExpenses = cashExpenseTotal + bankExpenseTotal;

      // Derived sell formula:
      // Cash Sell = Closing Cash + Cash Expenses + Cash to Home - Opening Cash - Other Income
      const derivedCashSales =
        Number(ledgerObj.closingBalance || 0) +
        cashExpenseTotal +
        Number(ledgerObj.cashToHome || 0) -
        Number(ledgerObj.openingBalance || 0) -
        Number(ledgerObj.otherIncome || 0) -
        cashIncomeTotal;

      const derivedDigitalSales =
        Number(ledgerObj.closingBankBalance || 0) +
        bankExpenseTotal +
        Number(ledgerObj.digitalToHome || 0) -
        Number(ledgerObj.openingBankBalance || 0) -
        bankIncomeTotal;

      ledgerObj.derivedCashSales = derivedCashSales;
      ledgerObj.derivedDigitalSales = derivedDigitalSales;
      ledgerObj.derivedTotalSales = derivedCashSales + derivedDigitalSales;
      ledgerObj.totalExpenses = totalExpenses;

      resolve(ledgerObj);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const saveLedger = (date, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      const {
        items = [],
        festival = "",
        notes = "",
        sweetProduction = [],
        openingBalance = 0,
        openingBankBalance = 0,
        otherIncome = 0,
        cashToHome = 0,
        digitalToHome = 0,
        closingBalance = 0,
        closingBankBalance = 0,
      } = payload;

      // Compute derived sales to persist in MongoDB
      const cashExpenseTotal = items
        .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankExpenseTotal = items
        .filter((i) => i.type === "expense" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const cashIncomeTotal = items
        .filter((i) => i.type === "income" && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankIncomeTotal = items
        .filter((i) => i.type === "income" && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const totalExpenses = cashExpenseTotal + bankExpenseTotal;

      const cashSales = Math.max(
        0,
        Number(closingBalance || 0) +
          cashExpenseTotal +
          Number(cashToHome || 0) -
          Number(openingBalance || 0) -
          Number(otherIncome || 0) -
          cashIncomeTotal
      );

      const digitalSales = Math.max(
        0,
        Number(closingBankBalance || 0) +
          bankExpenseTotal +
          Number(digitalToHome || 0) -
          Number(openingBankBalance || 0) -
          bankIncomeTotal
      );

      // Save as-is — closingBalance is the user's physical count, NOT computed
      const ledger = await DailyLedger.findOneAndUpdate(
        { date: targetDate },
        {
          date: targetDate,
          festival: festival || "",
          notes: notes || "",
          sweetProduction: sweetProduction || [],
          openingBalance: Number(openingBalance),
          openingBankBalance: Number(openingBankBalance),
          cashSales,
          digitalSales,
          otherIncome: Number(otherIncome),
          cashToHome: Number(cashToHome),
          digitalToHome: Number(digitalToHome),
          closingBalance: Number(closingBalance),
          closingBankBalance: Number(closingBankBalance),
          totalExpenses,
          items,
        },
        { upsert: true, new: true }
      );

      // --- AUTO SYNC NEXT DAY'S OPENING BALANCE ---
      try {
        const nextDayDateStr = dayjs(date).add(1, "day").format("YYYY-MM-DD");
        const nextDayDate = new Date(`${nextDayDateStr}T00:00:00.000Z`);
        const nextLedger = await DailyLedger.findOne({ date: nextDayDate });
        if (nextLedger) {
          nextLedger.openingBalance = Number(closingBalance || 0);
          nextLedger.openingBankBalance = Number(closingBankBalance || 0);
          const nItems = nextLedger.items || [];
          const nCashExpenses = nItems
            .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nBankExpenses = nItems
            .filter((i) => i.type === "expense" && i.paymentMode === "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nCashIncome = nItems
            .filter((i) => i.type === "income" && i.paymentMode !== "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nBankIncome = nItems
            .filter((i) => i.type === "income" && i.paymentMode === "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);

          nextLedger.cashSales = Math.max(
            0,
            Number(nextLedger.closingBalance || 0) +
              nCashExpenses +
              Number(nextLedger.cashToHome || 0) -
              Number(nextLedger.openingBalance || 0) -
              Number(nextLedger.otherIncome || 0) -
              nCashIncome
          );
          nextLedger.digitalSales = Math.max(
            0,
            Number(nextLedger.closingBankBalance || 0) +
              nBankExpenses +
              Number(nextLedger.digitalToHome || 0) -
              Number(nextLedger.openingBankBalance || 0) -
              nBankIncome
          );
          await nextLedger.save();
        }
      } catch (nextSyncErr) {
        console.error("Error auto-syncing next day opening balance:", nextSyncErr);
      }

      // --- AUTO SYNC CASH TO HOME & DIGITAL TO HOME (HOME INTAKE) ---
      try {
        const endOfDay = dayjs(date).endOf("day").toDate();

        // 1. Sync Cash to Home
        if (Number(cashToHome) > 0) {
          await HomeExpense.findOneAndUpdate(
            {
              date: { $gte: targetDate, $lte: endOfDay },
              category: "home_intake",
              paymentSource: "home_cash",
            },
            {
              date: targetDate,
              description: "Cash taken home from shop",
              amount: Number(cashToHome),
              category: "home_intake",
              paymentSource: "home_cash",
              sourceTag: "direct",
            },
            { upsert: true, new: true }
          );
        } else {
          await HomeExpense.deleteMany({
            date: { $gte: targetDate, $lte: endOfDay },
            category: "home_intake",
            paymentSource: "home_cash",
          });
        }

        // 2. Sync Digital to Home
        if (Number(digitalToHome) > 0) {
          await HomeExpense.findOneAndUpdate(
            {
              date: { $gte: targetDate, $lte: endOfDay },
              category: "home_intake",
              paymentSource: "bank_account",
            },
            {
              date: targetDate,
              description: "Digital funds transferred to home",
              amount: Number(digitalToHome),
              category: "home_intake",
              paymentSource: "bank_account",
              sourceTag: "direct",
            },
            { upsert: true, new: true }
          );
        } else {
          await HomeExpense.deleteMany({
            date: { $gte: targetDate, $lte: endOfDay },
            category: "home_intake",
            paymentSource: "bank_account",
          });
        }
      } catch (intakeErr) {
        console.error("Home intake sync error in ledgerController:", intakeErr);
      }

      // --- AUTO SYNC SAVED ITEMS TO VENDORS ONLY ---
      try {
        const savedItems = ledger.items || [];

        for (const item of savedItems) {
          if (item.type === "expense" && item.description && item.description.trim()) {
            const descName = item.description.trim();
            const itemAmount = Number(item.amount) || 0;
            const escapedName = descName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            let vendor = await Vendor.findOne({ name: new RegExp("^" + escapedName + "$", "i") });
            if (!vendor && descName) {
              vendor = new Vendor({
                name: descName,
                type: item.category === "supplier_payment" ? "flour" : "other",
                contact: "Auto-created from Ledger",
                address: "N/A",
                rate: 0,
              });
              await vendor.save();
            }

            if (vendor) {
              const existingTx = vendor.transactions.find((t) =>
                dayjs(t.date).isSame(targetDate, "day")
              );
              if (existingTx) {
                existingTx.amount = itemAmount;
                existingTx.paymentMethod = item.paymentMode === "bank" ? "bank" : "cash";
              } else {
                vendor.transactions.push({
                  date: targetDate,
                  quantity: 1,
                  amount: itemAmount,
                  paymentMethod: item.paymentMode === "bank" ? "bank" : "cash",
                });
              }
              vendor.lastPaymentDate = targetDate;
              await vendor.save();
            }
          }
        }
      } catch (syncErr) {
        console.error("Ledger save auto-sync error:", syncErr);
      }

      resolve(ledger);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getLedgerByDate, saveLedger };

