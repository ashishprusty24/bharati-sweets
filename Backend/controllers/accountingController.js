const Expense = require("../models/Expense");
const EventOrder = require("../models/EventOrder");
const HomeExpense = require("../models/HomeExpense");
const DailyLedger = require("../models/DailyLedger");

// Helper function to dynamically calculate total sales for any ledger document
const calculateLedgerSales = (ledger) => {
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

  const derivedCash = Math.max(
    0,
    Number(ledgerObj.closingBalance || 0) +
      cashExpenseTotal +
      Number(ledgerObj.cashToHome || 0) -
      Number(ledgerObj.openingBalance || 0) -
      Number(ledgerObj.otherIncome || 0) -
      cashIncomeTotal
  );

  const derivedDigital = Math.max(
    0,
    Number(ledgerObj.closingBankBalance || 0) +
      bankExpenseTotal +
      Number(ledgerObj.digitalToHome || 0) -
      Number(ledgerObj.openingBankBalance || 0) -
      bankIncomeTotal
  );

  const cashSales = ledgerObj.cashSales || derivedCash;
  const digitalSales = ledgerObj.digitalSales || derivedDigital;

  return {
    cashSales,
    digitalSales,
    totalSales: cashSales + digitalSales,
  };
};

const isExcludedExpenseCategory = (cat = "") => {
  const norm = String(cat).toLowerCase().trim();
  return (
    norm === "home_intake" ||
    norm === "home intake" ||
    norm === "personal" ||
    norm === "intake" ||
    norm === "cc_loan" ||
    norm === "cc_loan_repayment" ||
    norm === "credit_card_bill"
  );
};

const getFinancialSummary = (startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [expenses, homeExpenses, eventOrders, ledgers] = await Promise.all([
        Expense.find({ date: { $gte: startDate, $lte: endDate } }),
        // Exclude daily_ledger auto-synced records — those shop expenses are already
        // counted via the Expense model to avoid double-counting
        HomeExpense.find({ date: { $gte: startDate, $lte: endDate }, sourceTag: { $ne: "daily_ledger" } }),
        EventOrder.find({ createdAt: { $gte: startDate, $lte: endDate } }),
        DailyLedger.find({ date: { $gte: startDate, $lte: endDate } }),
      ]);

      // --- EXPENSES: Combine shop Expense + HomeExpense (excluding non-operating CC/intake) ---
      const shopExpenseTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const homeExpenseTotal = homeExpenses
        .filter((e) => !isExcludedExpenseCategory(e.category) && e.paymentSource !== "cc_loan" && e.paymentSource !== "credit_card")
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalExpenses = shopExpenseTotal + homeExpenseTotal;

      // --- REVENUE: Sum calculated Daily Ledger sales ---
      let ledgerRevenue = 0;
      for (const ledger of ledgers) {
        const sales = calculateLedgerSales(ledger);
        ledgerRevenue += sales.totalSales;
      }

      // Event order revenue (delivered orders or orders with paid amount)
      const eventRevenue = eventOrders
        .filter((o) => o.orderStatus === "delivered" || o.paidAmount > 0)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const totalRevenue = ledgerRevenue + eventRevenue;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

      // Expense distribution combining both models
      const expenseDistribution = {};
      expenses.forEach((exp) => {
        expenseDistribution[exp.category] = (expenseDistribution[exp.category] || 0) + (exp.amount || 0);
      });
      homeExpenses
        .filter((e) => !isExcludedExpenseCategory(e.category))
        .forEach((exp) => {
          expenseDistribution[exp.category] = (expenseDistribution[exp.category] || 0) + (exp.amount || 0);
        });

      // Weekly trend
      const profitTrend = [];
      let current = new Date(startDate);
      while (current < endDate) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd).reduce((sum, e) => sum + (e.amount || 0), 0);
        const weekHomeExpenses = homeExpenses.filter(e => e.date >= weekStart && e.date <= weekEnd && !isExcludedExpenseCategory(e.category)).reduce((sum, e) => sum + (e.amount || 0), 0);
        const weekEventRevenue = eventOrders.filter(o => o.createdAt >= weekStart && o.createdAt <= weekEnd).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        const weekLedgerSales = ledgers.filter(l => l.date >= weekStart && l.date <= weekEnd).reduce((sum, l) => sum + calculateLedgerSales(l).totalSales, 0);

        profitTrend.push({
          period: `Week ${profitTrend.length + 1}`,
          profit: weekLedgerSales + weekEventRevenue - weekExpenses - weekHomeExpenses,
        });
        current.setDate(current.getDate() + 7);
      }

      resolve({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        expenseDistribution,
        revenueDistribution: { ledger: ledgerRevenue, event: eventRevenue },
        revenueSource: "ledger_and_events",
        profitTrend,
        assets: { cash: 125000, inventory: 68500, equipment: 215000 },
      });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getTransactions = (startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [expenses, homeExpenses, eventOrders, ledgers] = await Promise.all([
        Expense.find({ date: { $gte: startDate, $lte: endDate } }),
        HomeExpense.find({ date: { $gte: startDate, $lte: endDate }, sourceTag: { $ne: "daily_ledger" } }),
        EventOrder.find({ createdAt: { $gte: startDate, $lte: endDate } }),
        DailyLedger.find({ date: { $gte: startDate, $lte: endDate } }),
      ]);

      const transactions = [
        ...expenses.map(e => ({ id: e._id, date: e.date, description: e.description, type: "expense", category: e.category, amount: e.amount, source: "shop" })),
        ...homeExpenses
          .filter((e) => !isExcludedExpenseCategory(e.category))
          .map(e => ({ id: e._id, date: e.date, description: e.description, type: "expense", category: e.category, amount: e.amount, source: "home" })),
        ...eventOrders.map(o => ({ id: o._id, date: o.createdAt, description: `Event: ${o.customerName} (${o.purpose})`, type: "revenue", category: "event", amount: o.totalAmount ?? 0 })),
        ...ledgers.map(l => ({
          id: l._id,
          date: l.date,
          description: `Daily Counter Sales`,
          type: "revenue",
          category: "ledger",
          amount: calculateLedgerSales(l).totalSales,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      resolve(transactions);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = { getFinancialSummary, getTransactions };
