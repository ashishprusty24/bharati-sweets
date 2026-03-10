const EventOrder = require("../models/EventOrder");
const RegularOrder = require("../models/RegularOrder");
const Expense = require("../models/Expense");
const Inventory = require("../models/Inventory");

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

    // Use aggregation for total sales (delivered event orders + regular orders)
    const [eventSalesData] = await EventOrder.aggregate([
      { $match: { orderStatus: "delivered", deliveryDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const [regularSalesData] = await RegularOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } }
    ]);

    const totalSales = (eventSalesData?.total || 0) + (regularSalesData?.total || 0);

    const [expenseData] = await Expense.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenseData?.total || 0;

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
    
    const matchStageRegular = { 
      orderDate: { $gte: startDate } 
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

    const regularSales = await RegularOrder.aggregate([
      { $match: matchStageRegular },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$orderDate" } },
          amount: { $sum: "$payment.amount" }
        }
      }
    ]);

    console.log(`[Dashboard] Fetched ${eventSales.length} event sales and ${regularSales.length} regular sales for period: ${period}`);

    const salesMap = {};
    [...eventSales, ...regularSales].forEach(sale => {
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

module.exports = {
  getSummaryData,
  getSalesData,
  getExpensesData,
  getPopularProducts,
  getPendingOrders,
};
