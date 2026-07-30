const DailyLedger = require("../models/DailyLedger");
const dayjs = require("dayjs");

const getLedgerByDate = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const targetDate = dayjs(date).startOf("day").toDate();

      let ledger = await DailyLedger.findOne({ date: targetDate });

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
          cashToHome: 0,
          digitalToHome: 0,
          closingBalance: 0,
          closingBankBalance: 0,
          items: [],
        });
      }

      // Compute derived sell from the formula:
      // Sell = ClosingBalance + Expenses + CashToHome - OpeningBalance
      const ledgerObj = ledger.toObject ? ledger.toObject() : { ...ledger };
      const items = ledgerObj.items || [];

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
      // Cash Sell = Closing Cash + Cash Expenses + Cash to Home - Opening Cash - Cash Income (extra income offsets)
      // Simplified: everything that LEFT + what's LEFT = everything that CAME IN
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

      resolve(ledger);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getLedgerByDate, saveLedger };
