const EventOrder = require("../models/EventOrder");
const Expense = require("../models/Expense");
const HomeExpense = require("../models/HomeExpense");
const DailyLedger = require("../models/DailyLedger");
const Inventory = require("../models/Inventory");
const Reminder = require("../models/Reminder");

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

const getSummaryData = async (period = "30d") => {
  try {
    const today = new Date();
    const startDate = new Date();
    
    if (period === "2y") {
      startDate.setFullYear(today.getFullYear() - 2);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // Event sales
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: "delivered", deliveryDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Daily Ledger sales
    const ledgers = await DailyLedger.find({ date: { $gte: startDate } });
    const ledgerSalesTotal = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l), 0);

    const totalSales = (eventSalesData?.total || 0) + ledgerSalesTotal;

    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const shopExpenses = expenseData?.total || 0;

    // Include HomeExpense (non-intake) for total expenses
    const [homeExpenseData] = await HomeExpense.aggregate([
      { $match: { date: { $gte: startDate }, category: { $nin: ["home_intake", "personal"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = shopExpenses + (homeExpenseData?.total || 0);

    const netProfit = totalSales - totalExpenses;
    const pendingOrders = await EventOrder.countDocuments({ orderStatus: "pending" });
    const lowStockItems = await Inventory.countDocuments({ status: "low-stock" });

    return {
      totalSales,
      totalExpenses,
      netProfit,
      pendingOrders,
      lowStockItems,
    };
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getSalesData = async (period = "30d") => {
  try {
    const today = new Date();
    const startDate = new Date();
    
    if (period === "2y") {
      startDate.setFullYear(today.getFullYear() - 2);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    const matchStageEvent = { 
      orderStatus: "delivered", 
      deliveryDate: { $gte: startDate } 
    };

    const groupFormat = period === "2y" ? "%Y-%m" : "%Y-%m-%d";

    const eventSales = await EventOrder.aggregate([
      { $match: matchStageEvent },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveryDate" } },
          amount: { $sum: "$totalAmount" }
        }
      }
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate } });
    const ledgerSales = ledgers.map(l => {
      const dateStr = l.date.toISOString().split("T")[0];
      return {
        _id: period === "2y" ? dateStr.slice(0, 7) : dateStr,
        amount: calculateLedgerSales(l)
      };
    });

    console.log(`[Dashboard] Fetched ${eventSales.length} event sales and ${ledgerSales.length} ledger sales for period: ${period}`);

    const salesMap = {};
    [...eventSales, ...ledgerSales].forEach(sale => {
      salesMap[sale._id] = (salesMap[sale._id] || 0) + sale.amount;
    });

    const salesData = [];
    if (period === "2y") {
      // Aggregate by month for 24 months
      for (let i = 0; i <= 24; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        if (d > today) break;
        const monthStr = d.toISOString().split("-").slice(0, 2).join("-");
        salesData.push({
          date: monthStr,
          amount: salesMap[monthStr] || 0
        });
      }
    } else {
      // Aggregate by day for 30 days
      for (let i = 0; i <= 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        if (d > today) break;
        const dateStr = d.toISOString().split("T")[0];
        salesData.push({
          date: dateStr,
          amount: salesMap[dateStr] || 0
        });
      }
    }

    console.log(`[Dashboard] Returning ${salesData.length} data points. Sum of amounts: ${salesData.reduce((s, a) => s + a.amount, 0)}`);
    return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (err) {
    throw { status: 500, message: err.message };
  }
};


const getExpensesData = async () => {
  try {
    const expenses = await Expense.aggregate([
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } },
      { $sort: { amount: -1 } }
    ]);
    return expenses;
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getPopularProducts = async () => {
  try {
    const eventProducts = await EventOrder.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          name: { $first: "$items.name" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const regularProducts = await RegularOrder.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          name: { $first: "$items.name" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const productMap = new Map();
    [...eventProducts, ...regularProducts].forEach((product) => {
      if (!product._id) return;
      const id = product._id.toString();
      if (productMap.has(id)) {
        const existing = productMap.get(id);
        existing.quantitySold += product.quantitySold;
        existing.revenue += product.revenue;
      } else {
        productMap.set(id, { ...product, _id: id });
      }
    });

    const products = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const inventoryIds = products.map((p) => p._id).filter(id => id);
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
    });

    const productsWithCategory = products.map((product) => {
      const item = inventoryItems.find((i) => i._id.toString() === product._id);
      return {
        ...product,
        category: item?.category || "Unknown",
        unit: item?.unit || "",
      };
    });

    return productsWithCategory;
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getPendingOrders = async () => {
  try {
    const orders = await EventOrder.find({ orderStatus: "pending" })
      .sort({ deliveryDate: 1 })
      .limit(5);
    return orders;
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getUpcomingReminders = async () => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    const upcoming = [];
    
    // Fetch from Reminder collection (The single source of truth for explicit reminders)
    const reminders = await Reminder.find();
    reminders.forEach(reminder => {
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
          eventType: reminder.eventType || "Event"
        });
      }
    });

    // Sort by nearest date
    upcoming.sort((a, b) => a.date - b.date);

    return upcoming.slice(0, 10); // Return top 10
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

module.exports = {
  getSummaryData,
  getSalesData,
  getExpensesData,
  getPopularProducts,
  getPendingOrders,
  getUpcomingReminders,
};
