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

  const derivedCash =
    Number(ledgerObj.closingBalance || 0) +
      cashExpenseTotal +
      Number(ledgerObj.cashToHome || 0) -
      Number(ledgerObj.openingBalance || 0) -
      Number(ledgerObj.otherIncome || 0) -
      cashIncomeTotal;

  const derivedDigital =
    Number(ledgerObj.closingBankBalance || 0) +
      bankExpenseTotal +
      Number(ledgerObj.digitalToHome || 0) -
      Number(ledgerObj.openingBankBalance || 0) -
      bankIncomeTotal;

  const cashSales = ledgerObj.cashSales || derivedCash;
  const digitalSales = ledgerObj.digitalSales || derivedDigital;

  return cashSales + digitalSales;
};

const getDateRange = (period = "30d", customStartDate, customEndDate) => {
  const now = new Date();
  let startDate;
  let endDate = customEndDate ? new Date(customEndDate) : new Date();

  if (customStartDate) {
    startDate = new Date(customStartDate);
  } else {
    startDate = new Date();
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "6m") {
      startDate.setMonth(now.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "2y") {
      startDate.setFullYear(now.getFullYear() - 2);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "all") {
      startDate = new Date(0);
    } else {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }
  }

  return { startDate, endDate };
};

const getSummaryData = async (period = "30d", customStartDate, customEndDate) => {
  try {
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    // Event sales
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: { $in: ["delivered", "confirmed", "ready", "pending"] }, deliveryDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" } } }
    ]);

    // Daily Ledger sales
    const ledgers = await DailyLedger.find({ date: { $gte: startDate, $lte: endDate } });
    const ledgerSalesTotal = ledgers.reduce((sum, l) => sum + calculateLedgerSales(l), 0);

    const totalSales = (eventSalesData?.total || 0) + ledgerSalesTotal;

    // Shop Expenses
    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const shopExpenses = expenseData?.total || 0;

    // Home Expenses — EXCLUDE non-expense categories & CC/loan borrowings:
    // - home_intake: money transfers from shop to home (not an expense)
    // - cc_loan / cc_loan_repayment: CC Loan withdrawals/repayments (funded by loan, not shop profit)
    // - credit_card_bill: CC bill payments
    // - Any expense where paymentSource is cc_loan or credit_card
    // Also exclude daily_ledger auto-synced duplicates and ledgerItemId-linked records
    const EXCLUDED_CATEGORIES = ["home_intake", "cc_loan", "cc_loan_repayment", "credit_card_bill"];
    const [homeExpenseData] = await HomeExpense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          category: { $nin: EXCLUDED_CATEGORIES },
          paymentSource: { $nin: ["cc_loan", "credit_card"] },
          sourceTag: { $ne: "daily_ledger" },
          $or: [
            { ledgerItemId: null },
            { ledgerItemId: { $exists: false } },
            { ledgerItemId: "" }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalHomeExpenses = homeExpenseData?.total || 0;

    const totalExpenses = shopExpenses + totalHomeExpenses;
    const netProfit = totalSales - totalExpenses;

    // Active Shop Cash & Bank Balance
    const latestLedger = await DailyLedger.findOne().sort({ date: -1 });
    let shopCash = 0;
    let shopBank = 0;

    if (latestLedger) {
      if (Number(latestLedger.closingBalance) > 0) {
        shopCash = Number(latestLedger.closingBalance);
      } else {
        const items = (latestLedger.items || []).filter(
          (i) => !/cc loan|cc_loan|credit_card/i.test(i.category || "") && !/cc loan:/i.test(i.description || "")
        );
        const cashExpenses = items
          .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const cashIncome = items
          .filter((i) => i.type === "income" && i.paymentMode !== "bank")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const cashSales = Number(latestLedger.cashSales || 0);
        const runningCash =
          Number(latestLedger.openingBalance || 0) +
          cashSales +
          cashIncome -
          cashExpenses -
          Number(latestLedger.cashToHome || 0);

        if (runningCash > 0) {
          shopCash = runningCash;
        } else if (Number(latestLedger.openingBalance) > 0) {
          shopCash = Number(latestLedger.openingBalance);
        } else {
          const prev = await DailyLedger.findOne({ closingBalance: { $gt: 0 } }).sort({ date: -1 });
          shopCash = prev ? Number(prev.closingBalance) : 0;
        }
      }

      if (Number(latestLedger.closingBankBalance) > 0) {
        shopBank = Number(latestLedger.closingBankBalance);
      } else {
        const items = (latestLedger.items || []).filter(
          (i) => !/cc loan|cc_loan|credit_card/i.test(i.category || "") && !/cc loan:/i.test(i.description || "")
        );
        const bankExpenses = items
          .filter((i) => i.type === "expense" && i.paymentMode === "bank")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const bankIncome = items
          .filter((i) => i.type === "income" && i.paymentMode === "bank")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const digitalSales = Number(latestLedger.digitalSales || 0);
        const runningBank =
          Number(latestLedger.openingBankBalance || 0) +
          digitalSales +
          bankIncome -
          bankExpenses -
          Number(latestLedger.digitalToHome || 0);

        if (runningBank > 0) {
          shopBank = runningBank;
        } else if (Number(latestLedger.openingBankBalance) > 0) {
          shopBank = Number(latestLedger.openingBankBalance);
        } else {
          const prev = await DailyLedger.findOne({ closingBankBalance: { $gt: 0 } }).sort({ date: -1 });
          shopBank = prev ? Number(prev.closingBankBalance) : 0;
        }
      }
    }

    // Home Intake Cash & Bank Balance
    const isIntakeCat = (cat = "") => {
      const norm = String(cat).toLowerCase().trim();
      return norm === "home_intake" || norm === "home intake" || norm === "personal" || norm === "intake";
    };

    const allHomeExpenses = await HomeExpense.find({
      sourceTag: { $ne: "daily_ledger" },
      $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
    });

    const homeIntake = allHomeExpenses.filter((e) => isIntakeCat(e.category));
    const homeReceivedCash = homeIntake
      .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const homeReceivedBank = homeIntake
      .filter((e) => e.paymentSource === "bank_account")
      .reduce((s, e) => s + (e.amount || 0), 0);

    const homeSpent = allHomeExpenses.filter((e) => !isIntakeCat(e.category));
    const homeSpentCash = homeSpent
      .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const homeSpentBank = homeSpent
      .filter((e) => e.paymentSource === "bank_account")
      .reduce((s, e) => s + (e.amount || 0), 0);

    const homeRemainingCash = Math.max(0, homeReceivedCash - homeSpentCash);
    const homeRemainingBank = Math.max(0, homeReceivedBank - homeSpentBank);

    // Combined Cash In Hand & Bank Balance (Home + Shop)
    const cashInHand = shopCash + homeRemainingCash;
    const bankBalance = shopBank + homeRemainingBank;

    // Credit Card & CC Loan payables — use correct virtual field names
    const creditCards = await CreditCard.find();
    const cardPayables = creditCards.reduce((s, c) => s + Number(c.currentOutstanding || 0), 0);

    const ccLoans = await CCLoan.find();
    const loanPayables = ccLoans.reduce((s, l) => s + Number(l.currentUtilized || 0), 0);

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

const getSalesData = async (period = "30d", customStartDate, customEndDate) => {
  try {
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const isMonthly = diffDays > 60 || ["2y", "1y", "all"].includes(period);

    const groupFormat = isMonthly ? "%Y-%m" : "%Y-%m-%d";

    const eventSales = await EventOrder.aggregate([
      { $match: { deliveryDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveryDate" } },
          amount: { $sum: "$totalAmount" }
        }
      }
    ]);

    const ledgers = await DailyLedger.find({ date: { $gte: startDate, $lte: endDate } });
    const ledgerSales = ledgers.map(l => {
      const dateStr = l.date.toISOString().split("T")[0];
      return {
        _id: isMonthly ? dateStr.slice(0, 7) : dateStr,
        amount: calculateLedgerSales(l)
      };
    });

    const salesMap = {};
    [...eventSales, ...ledgerSales].forEach(sale => {
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
          amount: salesMap[monthStr] || 0
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
          amount: salesMap[dateStr] || 0
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (err) {
    throw { status: 500, message: err.message };
  }
};

const getExpensesData = async (period = "30d", customStartDate, customEndDate) => {
  try {
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const shopExpenses = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $project: { category: "$_id", amount: 1, _id: 0 } }
    ]);

    const EXCLUDED_CATEGORIES = ["home_intake", "cc_loan", "cc_loan_repayment", "credit_card_bill"];
    const homeExpenses = await HomeExpense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          category: { $nin: EXCLUDED_CATEGORIES },
          paymentSource: { $nin: ["cc_loan", "credit_card"] },
          sourceTag: { $ne: "daily_ledger" },
          $or: [
            { ledgerItemId: null },
            { ledgerItemId: { $exists: false } },
            { ledgerItemId: "" }
          ]
        }
      },
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
