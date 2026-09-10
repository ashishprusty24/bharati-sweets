const HomeExpense = require("../models/HomeExpense");

const Vendor = require("../models/Vendor");
const Staff = require("../models/Staff");
const CreditCard = require("../models/CreditCard");
const CCLoan = require("../models/CCLoan");
const dayjs = require("dayjs");

const getHomeExpenses = (query = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = {
        // Exclude records auto-synced from the Daily Ledger:
        // 1. Records explicitly tagged "daily_ledger" (created by Backend auto-sync)
        // 2. Records with a ledgerItemId (linked to a specific ledger item)
        // After running /api/home-expenses/cleanup-ledger-sync, all stale records
        // will be tagged "daily_ledger" and hidden by condition #1.
        sourceTag: { $ne: "daily_ledger" },
        $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
      };

      if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = dayjs(query.startDate).startOf("day").toDate();
        if (query.endDate) filter.date.$lte = dayjs(query.endDate).endOf("day").toDate();
      }

      if (query.category) {
        filter.category = query.category;
      }

      const expenses = await HomeExpense.find(filter)
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits")
        .populate("ccLoanId", "accountName bankName accountNumber")
        .sort({ date: -1 });

      resolve(expenses);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const isIntakeCategory = (cat = "") => {
  const norm = String(cat).toLowerCase().trim();
  return (
    norm === "home_intake" ||
    norm === "home intake" ||
    norm === "personal" ||
    norm === "intake"
  );
};

const createHomeExpense = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Auto-vendor creation and transaction logging for any named expense item (e.g., Electricity Bill, Pradip Alu wala)
      if (data.description && !isIntakeCategory(data.category)) {
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

      // --- AUTO SYNC TO CREDIT CARD TRANSACTIONS ---
      if (data.paymentSource === "credit_card" && data.creditCardId) {
        try {
          const CreditCard = require("../models/CreditCard");
          const card = await CreditCard.findById(data.creditCardId);
          if (card) {
            card.transactions.push({
              date: data.date ? new Date(data.date) : new Date(),
              description: data.description || "Expense via Credit Card",
              amount: Number(data.amount) || 0,
              category: "business",
              isSettled: false,
            });
            await card.save();
          }
        } catch (ccErr) {
          console.error("Credit card transaction sync error in homeExpense:", ccErr);
        }
      }

      // --- AUTO SYNC TO CC LOAN ---
      if (data.paymentSource === "cc_loan" && data.ccLoanId) {
        try {
          const CCLoan = require("../models/CCLoan");
          const ccAccount = await CCLoan.findById(data.ccLoanId);
          if (ccAccount) {
            ccAccount.withdrawals.push({
              date: data.date ? new Date(data.date) : new Date(),
              description: data.description || "Withdrawal via Home Expense",
              amount: Number(data.amount) || 0,
              isRepaid: false,
            });
            await ccAccount.save();
          }
        } catch (ccErr) {
          console.error("CC Loan withdrawal sync error in homeExpense:", ccErr);
        }
      }

      // NOTE: Expenses are NOT synced to Daily Ledger.
      // Expense module and Daily Ledger are kept completely separate per customer requirement.

      const populated = await HomeExpense.findById(saved._id)
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits")
        .populate("ccLoanId", "accountName bankName accountNumber");
      resolve(populated);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateHomeExpense = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const oldExp = await HomeExpense.findById(id);
      const updated = await HomeExpense.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits")
        .populate("ccLoanId", "accountName bankName accountNumber");

      if (!updated) return reject({ status: 404, message: "Home expense not found" });

      const isCCExpenseData = (d) => {
        const cat = String(d.category || "").toLowerCase().trim();
        const src = String(d.paymentSource || "").toLowerCase().trim();
        const desc = String(d.description || "").toLowerCase().trim();
        return (
          src === "cc_loan" ||
          src === "credit_card" ||
          cat === "cc_loan" ||
          cat === "cc_loan_repayment" ||
          cat === "credit_card_bill" ||
          desc.startsWith("cc loan:") ||
          desc.startsWith("cc loan -")
        );
      };

      // NOTE: Expenses are NOT synced to Daily Ledger (per customer requirement).

      resolve(updated);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteHomeExpense = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const exp = await HomeExpense.findById(id);
      if (!exp) return reject({ status: 404, message: "Home expense not found" });

      // NOTE: Expenses are NOT synced to Daily Ledger (per customer requirement).

      // Cascade delete: Remove matching transaction from CreditCard
      if (exp.paymentSource === "credit_card" && exp.creditCardId) {
        try {
          const card = await CreditCard.findById(exp.creditCardId);
          if (card) {
            const txnIndex = card.transactions.findIndex(
              (t) =>
                t.amount === exp.amount &&
                (t.description === exp.description ||
                  t.description === `Expense via Credit Card` ||
                  exp.description?.includes(t.description) ||
                  t.description?.includes(exp.description?.replace("CC: ", "")))
            );
            if (txnIndex > -1) {
              card.transactions.splice(txnIndex, 1);
              await card.save();
            }
          }
        } catch (ccErr) {
          console.error("Error cascade-deleting CreditCard transaction on expense delete:", ccErr);
        }
      }

      // Cascade delete: Remove matching withdrawal from CCLoan
      if (exp.paymentSource === "cc_loan" && exp.ccLoanId) {
        try {
          const ccAccount = await CCLoan.findById(exp.ccLoanId);
          if (ccAccount) {
            const wdIndex = ccAccount.withdrawals.findIndex(
              (w) =>
                w.amount === exp.amount &&
                (w.description === exp.description ||
                  w.description === `Withdrawal via Home Expense` ||
                  exp.description?.includes(w.description) ||
                  w.description?.includes(exp.description?.replace("CC Loan: ", "")))
            );
            if (wdIndex > -1) {
              ccAccount.withdrawals.splice(wdIndex, 1);
              await ccAccount.save();
            }
          }
        } catch (ccErr) {
          console.error("Error cascade-deleting CCLoan withdrawal on expense delete:", ccErr);
        }
      }

      const result = await HomeExpense.findByIdAndDelete(id);
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
        ? dayjs(query.startDate).startOf("day").toDate()
        : dayjs().startOf("month").toDate();
      const endDate = query.endDate
        ? dayjs(query.endDate).endOf("day").toDate()
        : dayjs().endOf("month").toDate();

      // Exclude auto-synced daily ledger shop expenses — same logic as getHomeExpenses
      const expenses = await HomeExpense.find({
        date: { $gte: startDate, $lte: endDate },
        sourceTag: { $ne: "daily_ledger" },
        $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
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

      // ── HOME INTAKE BALANCE CALCULATION ──
      const isIntakeCategory = (cat = "") => {
        const norm = String(cat).toLowerCase().trim();
        return (
          norm === "home_intake" ||
          norm === "home intake" ||
          norm === "personal" ||
          norm === "intake"
        );
      };

      // Money RECEIVED into home (intake entries)
      const intakeEntries = expenses.filter((e) => isIntakeCategory(e.category));
      const receivedCash = intakeEntries
        .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
        .reduce((s, e) => s + (e.amount || 0), 0);
      const receivedBank = intakeEntries
        .filter((e) => e.paymentSource === "bank_account")
        .reduce((s, e) => s + (e.amount || 0), 0);

      // Money SPENT from home funds (non-intake entries)
      const spentEntries = expenses.filter((e) => !isIntakeCategory(e.category));
      const spentCash = spentEntries
        .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
        .reduce((s, e) => s + (e.amount || 0), 0);
      const spentBank = spentEntries
        .filter((e) => e.paymentSource === "bank_account")
        .reduce((s, e) => s + (e.amount || 0), 0);
      const spentCreditCard = spentEntries
        .filter((e) => e.paymentSource === "credit_card")
        .reduce((s, e) => s + (e.amount || 0), 0);
      const spentCCLoan = spentEntries
        .filter((e) => e.paymentSource === "cc_loan")
        .reduce((s, e) => s + (e.amount || 0), 0);

      const remainingCash = receivedCash - spentCash;
      const remainingBank = receivedBank - spentBank;

      resolve({
        total,
        count: expenses.length,
        byCategory,
        bySource,
        bySourceTag,
        homeIntakeSummary: {
          totalReceived: receivedCash + receivedBank,
          totalSpent: spentCash + spentBank,
          received: { cash: receivedCash, bank: receivedBank },
          spent: { cash: spentCash, bank: spentBank, creditCard: spentCreditCard, ccLoan: spentCCLoan },
          remaining: {
            cash: remainingCash,
            bank: remainingBank,
            total: remainingCash + remainingBank,
          },
          // Legacy fields for backward compatibility
          total: receivedCash + receivedBank,
          cash: receivedCash,
          bank: receivedBank,
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
