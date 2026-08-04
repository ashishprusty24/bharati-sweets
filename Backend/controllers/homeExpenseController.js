const HomeExpense = require("../models/HomeExpense");
const dayjs = require("dayjs");

const getHomeExpenses = (query = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = {};

      if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = new Date(query.startDate);
        if (query.endDate) filter.date.$lte = new Date(query.endDate);
      }

      if (query.category) {
        filter.category = query.category;
      }

      const expenses = await HomeExpense.find(filter)
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits")
        .sort({ date: -1 });

      resolve(expenses);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const DailyLedger = require("../models/DailyLedger");
const Vendor = require("../models/Vendor");

const createHomeExpense = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Auto-vendor creation and transaction logging for any named expense item (e.g., Electricity Bill, Pradip Alu wala)
      if (data.description && data.category !== "home_intake") {
        try {
          const vendorName = data.description.trim();
          let vendor = null;
          if (data.vendorId) {
            vendor = await Vendor.findById(data.vendorId);
          } else {
            vendor = await Vendor.findOne({ name: new RegExp("^" + vendorName + "$", "i") });
          }

          if (!vendor) {
            vendor = new Vendor({
              name: vendorName,
              type: data.category === "supplier_payment" ? "flour" : "other",
              contact: "Auto-created from Expense",
              address: "N/A",
              rate: 0,
            });
            await vendor.save();
          }

          if (vendor) {
            data.vendorId = vendor._id;
            const txDate = data.date ? new Date(data.date) : new Date();
            vendor.transactions.push({
              date: txDate,
              quantity: 1,
              amount: Number(data.amount) || 0,
              paymentMethod: data.paymentSource === "bank_account" ? "bank" : "cash",
            });
            vendor.lastPaymentDate = txDate;
            await vendor.save();
          }
        } catch (vErr) {
          console.error("Auto-vendor creation error in homeExpense:", vErr);
        }
      }

      const expense = new HomeExpense(data);
      const saved = await expense.save();

      // --- AUTO SYNC TO DAILY LEDGER ---
      try {
        const txDate = data.date ? new Date(data.date) : new Date();
        const targetDate = dayjs(txDate).startOf("day").toDate();
        let ledger = await DailyLedger.findOne({ date: targetDate });
        if (!ledger) {
          const prevDay = dayjs(targetDate).subtract(1, "day").startOf("day").toDate();
          const prevLedger = await DailyLedger.findOne({ date: prevDay });
          const openingBalance = prevLedger ? (prevLedger.closingBalance || 0) : 0;
          const openingBankBalance = prevLedger ? (prevLedger.closingBankBalance || 0) : 0;

          ledger = new DailyLedger({
            date: targetDate,
            openingBalance,
            openingBankBalance,
            items: [],
          });
        }

        if (data.category === "home_intake" || data.category === "personal") {
          if (data.paymentSource === "home_cash" || !data.paymentSource) {
            ledger.cashToHome = (Number(ledger.cashToHome) || 0) + Number(data.amount || 0);
          } else {
            ledger.digitalToHome = (Number(ledger.digitalToHome) || 0) + Number(data.amount || 0);
          }
        } else {
          ledger.items.push({
            description: data.description,
            amount: Number(data.amount) || 0,
            type: "expense",
            category: data.category || "other",
            vendorId: data.vendorId || null,
            paymentMode: data.paymentSource === "bank_account" ? "bank" : "cash",
          });
          ledger.totalExpenses = ledger.items
            .filter((i) => i.type === "expense")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        }
        await ledger.save();
      } catch (ledgerSyncErr) {
        console.error("Daily Ledger sync error in homeExpense:", ledgerSyncErr);
      }

      const populated = await HomeExpense.findById(saved._id)
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits");
      resolve(populated);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateHomeExpense = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated = await HomeExpense.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits");

      if (!updated) return reject({ status: 404, message: "Home expense not found" });
      resolve(updated);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteHomeExpense = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await HomeExpense.findByIdAndDelete(id);
      if (!result) return reject({ status: 404, message: "Home expense not found" });
      resolve(result);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getHomeExpenseSummary = (query = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const startDate = query.startDate
        ? new Date(query.startDate)
        : dayjs().startOf("month").toDate();
      const endDate = query.endDate
        ? new Date(query.endDate)
        : dayjs().endOf("month").toDate();

      const expenses = await HomeExpense.find({
        date: { $gte: startDate, $lte: endDate },
      });

      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

      const byCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
        return acc;
      }, {});

      const bySource = expenses.reduce((acc, e) => {
        acc[e.paymentSource] = (acc[e.paymentSource] || 0) + (e.amount || 0);
        return acc;
      }, {});

      const bySourceTag = expenses.reduce((acc, e) => {
        const tag = e.sourceTag || "direct";
        acc[tag] = (acc[tag] || 0) + (e.amount || 0);
        return acc;
      }, {});

      // Home intake breakdown (cash vs bank)
      const homeIntakeExpenses = expenses.filter(
        (e) => e.category === "home_intake" || e.category === "personal"
      );
      const homeIntakeCash = homeIntakeExpenses
        .filter((e) => e.paymentSource === "home_cash")
        .reduce((s, e) => s + (e.amount || 0), 0);
      const homeIntakeBank = homeIntakeExpenses
        .filter((e) => e.paymentSource === "bank_account")
        .reduce((s, e) => s + (e.amount || 0), 0);
      const homeIntakeTotal = homeIntakeCash + homeIntakeBank;

      resolve({
        total,
        count: expenses.length,
        byCategory,
        bySource,
        bySourceTag,
        homeIntakeSummary: {
          total: homeIntakeTotal,
          cash: homeIntakeCash,
          bank: homeIntakeBank,
        },
        period: { startDate, endDate },
      });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  getHomeExpenses,
  createHomeExpense,
  updateHomeExpense,
  deleteHomeExpense,
  getHomeExpenseSummary,
};
