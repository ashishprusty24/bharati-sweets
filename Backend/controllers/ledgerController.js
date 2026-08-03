const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");
const Vendor = require("../models/Vendor");
const dayjs = require("dayjs");

const getLedgerByDate = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const targetDate = dayjs(date).startOf("day").toDate();
      const endOfDay = dayjs(date).endOf("day").toDate();

      let ledger = await DailyLedger.findOne({ date: targetDate });

      // Auto-fetch recorded Home Intake (personal expenses / home cash) for this date
      let homeIntakeTotal = 0;
      try {
        const homeExpenses = await HomeExpense.find({
          date: { $gte: targetDate, $lte: endOfDay },
        });
        homeIntakeTotal = homeExpenses
          .filter((e) => e.category === "personal" || e.paymentSource === "home_cash")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      } catch (hErr) {
        console.error("Error auto-fetching home intake:", hErr);
      }

      if (!ledger) {
        // New day — auto-fill opening from previous day's closing (physical count)
        const prevDay = dayjs(date).subtract(1, "day").startOf("day").toDate();
        const prevLedger = await DailyLedger.findOne({ date: prevDay });
        const openingBalance = prevLedger ? (prevLedger.closingBalance || 0) : 0;
        const openingBankBalance = prevLedger ? (prevLedger.closingBankBalance || 0) : 0;

        ledger = new DailyLedger({
          date: targetDate,
          openingBalance,
          openingBankBalance,
          cashSales: 0,
          digitalSales: 0,
          totalExpenses: 0,
          otherIncome: 0,
          cashToHome: homeIntakeTotal,
          digitalToHome: 0,
          closingBalance: 0,
          closingBankBalance: 0,
          items: [],
        });
      } else if (!ledger.cashToHome && homeIntakeTotal > 0) {
        ledger.cashToHome = homeIntakeTotal;
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
          if (exp.category !== "personal" && exp.category !== "home_intake") {
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
      const targetDate = dayjs(date).startOf("day").toDate();
      const {
        items = [],
        openingBalance = 0,
        openingBankBalance = 0,
        otherIncome = 0,
        cashToHome = 0,
        digitalToHome = 0,
        closingBalance = 0,
        closingBankBalance = 0,
      } = payload;

      const totalExpenses = items
        .filter((i) => i.type === "expense")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      // Save as-is — closingBalance is the user's physical count, NOT computed
      const ledger = await DailyLedger.findOneAndUpdate(
        { date: targetDate },
        {
          date: targetDate,
          openingBalance: Number(openingBalance),
          openingBankBalance: Number(openingBankBalance),
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

      // --- AUTO SYNC SAVED ITEMS TO HOME EXPENSES & VENDORS ---
      try {
        const endOfDay = dayjs(date).endOf("day").toDate();
        for (const item of items) {
          if (item.type === "expense" && item.description) {
            const exists = await HomeExpense.findOne({
              date: { $gte: targetDate, $lte: endOfDay },
              description: item.description,
              amount: Number(item.amount),
            });

            const descName = item.description.trim();
            let vendor = await Vendor.findOne({ name: new RegExp("^" + descName + "$", "i") });
            if (!vendor && item.category === "supplier_payment") {
              vendor = new Vendor({
                name: descName,
                type: "other",
                contact: "Auto-created from Ledger",
                address: "N/A",
                rate: 0,
              });
              await vendor.save();
            }

            if (vendor) {
              const hasTx = vendor.transactions.some(
                (t) =>
                  dayjs(t.date).isSame(targetDate, "day") && Number(t.amount) === Number(item.amount)
              );
              if (!hasTx) {
                vendor.transactions.push({
                  date: targetDate,
                  quantity: 1,
                  amount: Number(item.amount) || 0,
                  paymentMethod: item.paymentMode === "bank" ? "bank" : "cash",
                });
                vendor.lastPaymentDate = targetDate;
                await vendor.save();
              }
            }

            if (!exists) {
              const newExp = new HomeExpense({
                date: targetDate,
                description: item.description,
                amount: Number(item.amount) || 0,
                category: item.category || "other",
                paymentSource: item.paymentMode === "bank" ? "bank_account" : "home_cash",
                vendorId: vendor ? vendor._id : item.vendorId || null,
              });
              await newExp.save();
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
