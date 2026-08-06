import connectDB from "../database/mongodb";
import EventOrder from "../models/EventOrder";
import DailyLedger from "../models/DailyLedger";
import Expense from "../models/Expense";
import Inventory from "../models/Inventory";
import Reminder from "../models/Reminder";

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
  static async getMetrics(startDate) {
    await connectDB();
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: "delivered", deliveryDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate } }).lean();
    const ledgerSalesTotal = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l), 0);

    const totalSales = (eventSalesData?.total || 0) + ledgerSalesTotal;

    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = expenseData?.total || 0;

    const netProfit = totalSales - totalExpenses;
    const pendingOrders = await EventOrder.countDocuments({ status: "pending" });
    const lowStockItems = await Inventory.countDocuments({ quantity: { $lte: 5 } });

    return {
      totalSales,
      totalExpenses,
      netProfit,
      pendingOrders,
      lowStockItems,
    };
  }

  static async getSalesTrend(startDate, period = "30d") {
    await connectDB();
    const groupFormat = period === "2y" ? "%Y-%m" : "%Y-%m-%d";

    const eventSales = await EventOrder.aggregate([
      { $match: { deliveryDate: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveryDate" } },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate } }).lean();
    const ledgerSales = ledgers.map((l) => {
      const dateStr = new Date(l.date).toISOString().split("T")[0];
      return {
        _id: period === "2y" ? dateStr.slice(0, 7) : dateStr,
        amount: calculateLedgerSales(l),
      };
    });

    const salesMap = {};
    [...eventSales, ...ledgerSales].forEach((sale) => {
      salesMap[sale._id] = (salesMap[sale._id] || 0) + sale.amount;
    });

    return Object.entries(salesMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  static async getExpenseCategoryDistribution() {
    await connectDB();
    return await Expense.aggregate([
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } },
      { $sort: { amount: -1 } },
    ]);
  }

  static async getPendingOrders() {
    await connectDB();
    return await EventOrder.find({ status: "pending" })
      .sort({ eventDate: 1 })
      .limit(5)
      .lean();
  }

  static async getUpcomingReminders() {
    await connectDB();
    return await Reminder.find({ eventDate: { $gte: new Date() } })
      .sort({ eventDate: 1 })
      .limit(5)
      .lean();
  }
}
