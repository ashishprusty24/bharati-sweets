import connectDB from "../database/mongodb";
import Expense from "../models/Expense";
import EventOrder from "../models/EventOrder";
import DailyLedger from "../models/DailyLedger";

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

export const getFinancialSummary = async (startDate, endDate) => {
  await connectDB();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [expenses, eventOrders, ledgers] = await Promise.all([
    Expense.find({ date: { $gte: start, $lte: end } }).lean(),
    EventOrder.find({ createdAt: { $gte: start, $lte: end } }).lean(),
    DailyLedger.find({ date: { $gte: start, $lte: end } }).lean(),
  ]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const ledgerRevenue = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l).totalSales, 0);
  const eventRevenue = eventOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.advancePaid ?? 0), 0);

  const totalRevenue = ledgerRevenue + eventRevenue;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

  const expenseDistribution = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
    return acc;
  }, {});

  const profitTrend = [];
  let current = new Date(start);
  while (current < end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd).reduce((sum, e) => sum + (e.amount || 0), 0);
    const weekLedgerRevenue = ledgers.filter(l => l.date >= weekStart && l.date <= weekEnd).reduce((sum, l) => sum + calculateLedgerSales(l).totalSales, 0);
    const weekEventRevenue = eventOrders.filter(o => o.createdAt >= weekStart && o.createdAt <= weekEnd).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

    profitTrend.push({ period: `Week ${profitTrend.length + 1}`, profit: weekLedgerRevenue + weekEventRevenue - weekExpenses });
    current.setDate(current.getDate() + 7);
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expenseDistribution,
    revenueDistribution: { ledger: ledgerRevenue, event: eventRevenue },
    profitTrend,
    assets: { cash: 125000, inventory: 68500, equipment: 215000 },
  };
};

export const getTransactions = async (startDate, endDate) => {
  await connectDB();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [expenses, eventOrders, ledgers] = await Promise.all([
    Expense.find({ date: { $gte: start, $lte: end } }).lean(),
    EventOrder.find({ createdAt: { $gte: start, $lte: end } }).lean(),
    DailyLedger.find({ date: { $gte: start, $lte: end } }).lean(),
  ]);

  return [
    ...expenses.map(e => ({ id: e._id.toString(), date: e.date, description: e.description, type: "expense", category: e.category, amount: e.amount })),
    ...ledgers.map(l => ({ id: l._id.toString(), date: l.date, description: `Daily Counter Sales`, type: "revenue", category: "ledger", amount: calculateLedgerSales(l).totalSales })),
    ...eventOrders.map(o => ({ id: o._id.toString(), date: o.createdAt, description: `${o.purpose || 'Event'} order`, type: "revenue", category: "event", amount: o.totalAmount ?? 0 })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
};
