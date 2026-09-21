const CCLoan = require("../models/CCLoan");

// ── ACCOUNT CRUD ──

const getAllAccounts = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const accounts = await CCLoan.find();
      resolve(accounts);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getAccountById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(id);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });
      resolve(account);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createAccount = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = new CCLoan(data);
      const saved = await account.save();
      resolve(saved);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateAccount = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findByIdAndUpdate(
        id,
        {
          accountName: data.accountName,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          sanctionedLimit: data.sanctionedLimit,
          sanctionDate: data.sanctionDate,
        },
        { new: true, runValidators: true }
      );
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });
      resolve(account);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteAccount = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await CCLoan.findByIdAndDelete(id);
      if (!result) return reject({ status: 404, message: "CC Loan account not found" });
      resolve(result);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// ── WITHDRAWAL OPERATIONS ──

const addWithdrawal = (accountId, withdrawalData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(accountId);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });

      const txDate = withdrawalData.date ? new Date(withdrawalData.date) : new Date();
      const amount = Number(withdrawalData.amount) || 0;
      const description = (withdrawalData.description || "CC Loan Withdrawal").trim();

      const newWithdrawal = {
        date: txDate,
        amount,
        description,
        isRepaid: false,
      };

      account.withdrawals.push(newWithdrawal);
      const saved = await account.save();

      // Auto-sync to HomeExpense so it appears in the Expenses table
      try {
        const HomeExpense = require("../models/HomeExpense");
        const formattedDesc = description.toLowerCase().startsWith("cc loan")
          ? description
          : `CC Loan: ${description}`;

        const existing = await HomeExpense.findOne({
          ccLoanId: account._id,
          amount,
          date: txDate,
          description: formattedDesc,
        });

        if (!existing) {
          await HomeExpense.create({
            description: formattedDesc,
            amount,
            date: txDate,
            category: "cc_loan",
            paymentSource: "cc_loan",
            ccLoanId: account._id,
            sourceTag: "direct",
            notes: `Auto-created from CC Loan (${account.accountName})`,
          });
        }
      } catch (hErr) {
        console.error("Failed to sync CC Loan withdrawal to HomeExpense:", hErr);
      }

      resolve(saved);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const dayjs = require("dayjs");

const deleteWithdrawal = (accountId, withdrawalId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(accountId);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });

      const item = account.withdrawals.id(withdrawalId);
      if (item) {
        // Also remove from HomeExpense
        try {
          const HomeExpense = require("../models/HomeExpense");
          const targetDate = dayjs(item.date).startOf("day").toDate();
          const nextDay = dayjs(item.date).endOf("day").toDate();
          await HomeExpense.findOneAndDelete({
            ccLoanId: account._id,
            amount: item.amount,
            date: { $gte: targetDate, $lte: nextDay },
          });
        } catch (hErr) {
          console.error("Failed to delete matching HomeExpense for CC Loan withdrawal:", hErr);
        }
        account.withdrawals.pull(withdrawalId);
      }

      await account.save();
      resolve(account);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteRepayment = (accountId, repaymentId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(accountId);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });

      const item = account.repayments.id(repaymentId);
      if (item) {
        const rDate = item.date ? new Date(item.date) : new Date();
        const rAmount = item.amount;

        // Cascade delete corresponding HomeExpense
        try {
          const HomeExpense = require("../models/HomeExpense");
          const targetDate = dayjs(rDate).startOf("day").toDate();
          const nextDay = dayjs(rDate).endOf("day").toDate();
          await HomeExpense.findOneAndDelete({
            ccLoanId: account._id,
            amount: rAmount,
            category: "cc_loan_repayment",
            date: { $gte: targetDate, $lte: nextDay },
          });
        } catch (hErr) {
          console.error("Failed to delete matching HomeExpense on CC Loan repayment delete:", hErr);
        }

        account.repayments.pull(repaymentId);
      }

      await account.save();
      resolve(account);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ── REPAYMENT OPERATIONS ──

const addRepayment = (accountId, repaymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(accountId);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });

      const txDate = repaymentData.date ? new Date(repaymentData.date) : new Date();
      const totalAmount = Number(repaymentData.amount) || 0;
      const notes = (repaymentData.notes || "").trim();
      const paidFrom = repaymentData.paidFrom || "bank_account";

      account.repayments.push({
        date: txDate,
        amount: totalAmount,
        paidFrom,
        notes,
      });

      await account.save();

      // Create HomeExpense with paymentSource = home_cash/bank_account
      // This WILL affect net profit because real money leaves the shop/home
      try {
        const HomeExpense = require("../models/HomeExpense");
        const desc = `CC Loan Repayment: ${account.accountName} (${account.bankName})`;

        await HomeExpense.create({
          description: desc,
          amount: totalAmount,
          date: txDate,
          category: "cc_loan_repayment",
          paymentSource: paidFrom,
          ccLoanId: account._id,
          sourceTag: "direct",
          notes: notes || `Repayment from ${paidFrom === "home_cash" ? "Home Cash" : "Bank Account"}`,
        });
      } catch (hErr) {
        console.error("Failed to sync CC Loan repayment to HomeExpense:", hErr);
      }

      resolve(account);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ── SUMMARY ──

const getAccountSummary = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const accounts = await CCLoan.find();

      const summary = accounts.map((acc) => ({
        _id: acc._id,
        accountName: acc.accountName,
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        sanctionedLimit: acc.sanctionedLimit,
        currentUtilized: acc.currentUtilized,
        availableLimit: acc.availableLimit,
        totalWithdrawals: acc.withdrawals.length,
        totalRepayments: acc.repayments.length,
        totalWithdrawnAmount: acc.withdrawals.reduce((s, w) => s + (w.amount || 0), 0),
        totalRepaidAmount: acc.repayments.reduce((s, r) => s + (r.amount || 0), 0),
      }));

      const totalUtilized = summary.reduce((s, a) => s + a.currentUtilized, 0);
      const totalLimit = summary.reduce((s, a) => s + a.sanctionedLimit, 0);

      resolve({
        accounts: summary,
        totalUtilized,
        totalLimit,
        totalAvailable: totalLimit - totalUtilized,
      });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  addWithdrawal,
  deleteWithdrawal,
  addRepayment,
  deleteRepayment,
  getAccountSummary,
};

