const DailyLedger = require("../models/DailyLedger");
const RegularOrder = require("../models/RegularOrder");
const EventOrder = require("../models/EventOrder");
const Expense = require("../models/Expense");
const dayjs = require("dayjs");

const getLedgerByDate = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const targetDate = dayjs(date).startOf("day").toDate();
      const endDate = dayjs(date).endOf("day").toDate();

      let ledger = await DailyLedger.findOne({ date: targetDate });

      if (!ledger) {
        const [regOrders, eventPayments, expenses] = await Promise.all([
          RegularOrder.find({ orderDate: { $gte: targetDate, $lte: endDate } }),
          EventOrder.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.timestamp": { $gte: targetDate, $lte: endDate } } },
            { $group: { _id: "$payments.method", total: { $sum: "$payments.amount" } } }
          ]),
          Expense.find({ date: { $gte: targetDate, $lte: endDate } })
        ]);

        const cashSales = regOrders.filter(o => o.payment.method === "cash").reduce((s, o) => s + o.payment.amount, 0) +
                        (eventPayments.find(p => p._id === "cash")?.total || 0);
        
        const digitalSales = regOrders.filter(o => o.payment.method !== "cash").reduce((s, o) => s + o.payment.amount, 0) +
                           eventPayments.filter(p => p._id !== "cash").reduce((s, p) => s + p.total, 0);

        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

        const prevDay = dayjs(date).subtract(1, "day").startOf("day").toDate();
        const prevLedger = await DailyLedger.findOne({ date: prevDay });
        const openingBalance = prevLedger ? prevLedger.closingBalance : 0;

        ledger = new DailyLedger({
          date: targetDate,
          openingBalance,
          cashSales,
          digitalSales,
          totalExpenses,
          closingBalance: Number(openingBalance) + Number(cashSales) - totalExpenses,
          items: expenses.map(e => ({
            description: e.description,
            amount: e.amount,
            type: "expense",
            category: e.category
          }))
        });
      }

      resolve(ledger);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const saveLedger = (date, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const targetDate = dayjs(date).startOf("day").toDate();
      const { items = [], openingBalance = 0, cashSales = 0, otherIncome = 0 } = payload;
      
      const totalExpenses = items.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0);
      const totalIncome = items.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0);
      
      const closingBalance = Number(openingBalance) + Number(cashSales) + Number(otherIncome) + totalIncome - totalExpenses;

      const ledger = await DailyLedger.findOneAndUpdate(
        { date: targetDate },
        { 
          ...payload, 
          totalExpenses, 
          closingBalance,
          date: targetDate 
        },
        { upsert: true, new: true }
      );

      resolve(ledger);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getLedgerByDate, saveLedger };
