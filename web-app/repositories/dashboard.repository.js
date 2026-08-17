import connectDB from "../database/mongodb";
import EventOrder from "../models/EventOrder";
import DailyLedger from "../models/DailyLedger";
import Expense from "../models/Expense";
import HomeExpense from "../models/HomeExpense";
import Inventory from "../models/Inventory";
import Reminder from "../models/Reminder";
import CreditCard from "../models/CreditCard";
import CCLoan from "../models/CCLoan";

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

  return cashSales + digitalSales;
};

export class DashboardRepository {
  static async getMetrics(startDate, endDate = new Date()) {
    await connectDB();
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: { $in: ["delivered", "confirmed", "ready", "pending"] }, deliveryDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate, $lte: endDate } }).lean();
    const ledgerSalesTotal = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l), 0);

    const totalSales = (eventSalesData?.total || 0) + ledgerSalesTotal;

    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const shopExpenses = expenseData?.total || 0;

    const [homeExpenseData] = await HomeExpense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalHomeExpenses = homeExpenseData?.total || 0;

    const totalExpenses = shopExpenses + totalHomeExpenses;
    const netProfit = totalSales - totalExpenses;

    const latestLedger = await DailyLedger.findOne().sort({ date: -1 }).lean();
    const cashInHand = latestLedger ? Number(latestLedger.closingBalance || latestLedger.cashToHome || 0) : 0;
    const bankBalance = latestLedger ? Number(latestLedger.closingBankBalance || latestLedger.digitalToHome || 0) : 0;

    const creditCards = await CreditCard.find().lean();
    const cardPayables = creditCards.reduce((s, c) => s + Number(c.outstandingBalance || c.currentBalance || 0), 0);

    const ccLoans = await CCLoan.find().lean();
    const loanPayables = ccLoans.reduce((s, l) => s + Number(l.outstandingPrincipal || l.currentDrawdown || 0), 0);

    const totalPayables = cardPayables + loanPayables;

    const activeEventOrders = await EventOrder.find({ orderStatus: { $in: ["pending", "confirmed", "preparing"] } }).lean();
    const pendingOrdersCount = activeEventOrders.length;
    const totalBalanceDue = activeEventOrders.reduce((s, o) => s + Math.max(0, Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);

    const inventoryAll = await Inventory.find().lean();
    const lowStockItemsCount = inventoryAll.filter(i => (i.quantity <= (i.minStock || 5)) || i.status === "low-stock" || i.status === "out-of-stock").length;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      cashInHand,
      bankBalance,
      totalPayables,
      pendingOrders: pendingOrdersCount,
      totalBalanceDue,
      lowStockItems: lowStockItemsCount,
    };
  }

  static async getSalesTrend(startDate, period = "30d", endDate = new Date()) {
    await connectDB();
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const isMonthly = diffDays > 60 || ["2y", "1y", "all"].includes(period);
    const groupFormat = isMonthly ? "%Y-%m" : "%Y-%m-%d";

    const eventSales = await EventOrder.aggregate([
      { $match: { deliveryDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveryDate" } },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate, $lte: endDate } }).lean();
    const ledgerSales = ledgers.map((l) => {
      const dateStr = new Date(l.date).toISOString().split("T")[0];
      return {
        _id: isMonthly ? dateStr.slice(0, 7) : dateStr,
        amount: calculateLedgerSales(l),
      };
    });

    const salesMap = {};
    [...eventSales, ...ledgerSales].forEach((sale) => {
      salesMap[sale._id] = (salesMap[sale._id] || 0) + sale.amount;
    });

    const salesData = [];
    if (isMonthly) {
      const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const limit = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
      while (curr < limit && curr <= new Date()) {
        const monthStr = curr.toISOString().split("-").slice(0, 2).join("-");
        salesData.push({
          date: monthStr,
          amount: salesMap[monthStr] || 0,
        });
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      const curr = new Date(startDate);
      curr.setHours(0,0,0,0);
      const limit = new Date(endDate);
      limit.setHours(23,59,59,999);
      while (curr <= limit && curr <= new Date()) {
        const dateStr = curr.toISOString().split("T")[0];
        salesData.push({
          date: dateStr,
          amount: salesMap[dateStr] || 0,
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  static async getExpenseBreakdown(startDate, endDate = new Date()) {
    await connectDB();
    const matchCond = startDate ? { date: { $gte: startDate, $lte: endDate } } : {};
    const shopExpenses = await Expense.aggregate([
      ...(startDate ? [{ $match: matchCond }] : []),
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } },
    ]);

    const homeExpenses = await HomeExpense.aggregate([
      ...(startDate ? [{ $match: matchCond }] : []),
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } },
    ]);

    const catMap = {};
    [...shopExpenses, ...homeExpenses].forEach((item) => {
      if (!item.category) return;
      const catKey = item.category.toLowerCase().replace(/\s+/g, "_");
      catMap[catKey] = (catMap[catKey] || 0) + item.amount;
    });

    return Object.keys(catMap)
      .map((key) => ({ category: key, amount: catMap[key] }))
      .sort((a, b) => b.amount - a.amount);
  }

  static async getPendingOrders() {
    await connectDB();
    return EventOrder.find({ orderStatus: { $in: ["pending", "confirmed", "preparing"] } })
      .sort({ deliveryDate: 1 })
      .limit(6)
      .lean();
  }

  static async getUpcomingReminders() {
    await connectDB();
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    const upcoming = [];

    const reminders = await Reminder.find().lean();
    reminders.forEach((reminder) => {
      const anniv = new Date(reminder.eventDate);
      const thisYearAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());

      if (thisYearAnniv < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        thisYearAnniv.setFullYear(today.getFullYear() + 1);
      }

      if (thisYearAnniv >= today && thisYearAnniv <= nextMonth) {
        upcoming.push({
          id: reminder._id,
          customerName: reminder.customerName,
          spouseName: reminder.secondaryName,
          phone: reminder.phone,
          date: thisYearAnniv,
          originalDate: reminder.eventDate,
          eventType: reminder.eventType || "Event",
        });
      }
    });

    return upcoming.sort((a, b) => a.date - b.date).slice(0, 10);
  }

  static async getLowStockItems() {
    await connectDB();
    const inventoryAll = await Inventory.find().lean();
    return inventoryAll.filter(i => (i.quantity <= (i.minStock || 5)) || i.status === "low-stock" || i.status === "out-of-stock");
  }
}
