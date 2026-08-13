const EventOrder = require("../models/EventOrder");
const Expense = require("../models/Expense");
const HomeExpense = require("../models/HomeExpense");
const DailyLedger = require("../models/DailyLedger");
const Inventory = require("../models/Inventory");
const Reminder = require("../models/Reminder");
const CreditCard = require("../models/CreditCard");
const CCLoan = require("../models/CCLoan");
const RegularOrder = require("../models/RegularOrder");

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
    } else if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    // Event sales
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: { $in: ["delivered", "confirmed", "ready", "pending"] }, deliveryDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" } } }
    ]);

    // Daily Ledger sales
    const ledgers = await DailyLedger.find({ date: { $gte: startDate } });
    const ledgerSalesTotal = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l), 0);

    const totalSales = (eventSalesData?.total || 0) + ledgerSalesTotal;

    // Shop Expenses
    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const shopExpenses = expenseData?.total || 0;

    // Home Expenses
    const [homeExpenseData] = await HomeExpense.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalHomeExpenses = homeExpenseData?.total || 0;

    const totalExpenses = shopExpenses + totalHomeExpenses;
    const netProfit = totalSales - totalExpenses;

    // Latest Ledger balances for cash/bank status
    const latestLedger = await DailyLedger.findOne().sort({ date: -1 });
    const cashInHand = latestLedger ? Number(latestLedger.closingBalance || latestLedger.cashToHome || 0) : 0;
    const bankBalance = latestLedger ? Number(latestLedger.closingBankBalance || latestLedger.digitalToHome || 0) : 0;

    // Credit Card & CC Loan payables
    const creditCards = await CreditCard.find();
    const cardPayables = creditCards.reduce((s, c) => s + Number(c.outstandingBalance || c.currentBalance || 0), 0);

    const ccLoans = await CCLoan.find();
    const loanPayables = ccLoans.reduce((s, l) => s + Number(l.outstandingPrincipal || l.currentDrawdown || 0), 0);

    const totalPayables = cardPayables + loanPayables;

    // Active event orders pending delivery & balance due
    const activeEventOrders = await EventOrder.find({ orderStatus: { $in: ["pending", "confirmed", "preparing"] } });
    const pendingOrdersCount = activeEventOrders.length;
    const totalBalanceDue = activeEventOrders.reduce((s, o) => s + Math.max(0, Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);

    // Low Stock Items (quantity <= minStock)
    const inventoryAll = await Inventory.find();
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

    const groupFormat = period === "2y" ? "%Y-%m" : "%Y-%m-%d";

    const eventSales = await EventOrder.aggregate([
      { $match: { deliveryDate: { $gte: startDate } } },
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

    const salesMap = {};
    [...eventSales, ...ledgerSales].forEach(sale => {
      salesMap[sale._id] = (salesMap[sale._id] || 0) + sale.amount;
    });

    const salesData = [];
    if (period === "2y") {
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

    return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getExpensesData = async () => {
  try {
    const shopExpenses = await Expense.aggregate([
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } }
    ]);

    const homeExpenses = await HomeExpense.aggregate([
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } }
    ]);

    const catMap = {};
    [...shopExpenses, ...homeExpenses].forEach(item => {
      if (!item.category) return;
      const catKey = item.category.toLowerCase().replace(/\s+/g, "_");
      catMap[catKey] = (catMap[catKey] || 0) + item.amount;
    });

    const categories = Object.keys(catMap).map(key => ({
      category: key,
      amount: catMap[key]
    })).sort((a, b) => b.amount - a.amount);

    return categories;
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
        category: item?.category || "Sweets",
        kitchenSection: item?.kitchenSection || "Sweets",
        unit: item?.unit || "kg",
      };
    });

    return productsWithCategory;
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getPendingOrders = async () => {
  try {
    const orders = await EventOrder.find({ orderStatus: { $in: ["pending", "confirmed", "preparing"] } })
      .sort({ deliveryDate: 1 })
      .limit(6);
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

    upcoming.sort((a, b) => a.date - b.date);
    return upcoming.slice(0, 10);
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getFinancialHealthData = async () => {
  try {
    const creditCards = await CreditCard.find();
    const ccLoans = await CCLoan.find();
    return { creditCards, ccLoans };
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
  getFinancialHealthData,
};
