import connectDB from "../database/mongodb";
import EventOrder from "../models/EventOrder";
import RegularOrder from "../models/RegularOrder";
import Expense from "../models/Expense";
import Inventory from "../models/Inventory";
import Reminder from "../models/Reminder";

export class DashboardRepository {
  static async getMetrics(startDate) {
    await connectDB();
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: "delivered", deliveryDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const [regularSalesData] = await RegularOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } },
    ]);

    const totalSales = (eventSalesData?.total || 0) + (regularSalesData?.total || 0);

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
      { $match: { eventDate: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$eventDate" } },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const regularSales = await RegularOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$orderDate" } },
          amount: { $sum: "$payment.amount" },
        },
      },
    ]);

    const salesMap = {};
    [...eventSales, ...regularSales].forEach((sale) => {
      salesMap[sale._id] = (salesMap[sale._id] || 0) + sale.amount;
    });

    const salesData = [];
    const today = new Date();
    if (period === "2y") {
      for (let i = 0; i <= 24; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        if (d > today) break;
        const monthStr = d.toISOString().split("-").slice(0, 2).join("-");
        salesData.push({ date: monthStr, amount: salesMap[monthStr] || 0 });
      }
    } else {
      for (let i = 0; i <= 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        if (d > today) break;
        const dateStr = d.toISOString().split("T")[0];
        salesData.push({ date: dateStr, amount: salesMap[dateStr] || 0 });
      }
    }

    return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  static async getExpenseBreakdown() {
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
      .limit(5);
  }

  static async getLowStockItems() {
    await connectDB();
    return await Inventory.find({ quantity: { $lte: 10 } }).sort({ quantity: 1 });
  }

  static async getReminders() {
    await connectDB();
    return await Reminder.find().sort({ eventDate: 1 });
  }
}
