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

      account.withdrawals.push({
        date: txDate,
        amount,
        description,
        isRepaid: false,
      });

      // NOTE: HomeExpense is NOT created here for raw withdrawals.
      // When an expense is paid via CC Loan from the Expenses page,
      // homeExpenseController.createHomeExpense() handles both the
      // HomeExpense record AND the CC Loan withdrawal sync.
      // Creating a HomeExpense here would cause double-counting.

      await account.save();
      resolve(account);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteWithdrawal = (accountId, withdrawalId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await CCLoan.findById(accountId);
      if (!account) return reject({ status: 404, message: "CC Loan account not found" });

      account.withdrawals.id(withdrawalId).deleteOne();
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

      account.repayments.push({
        date: txDate,
        amount: totalAmount,
        notes,
      });

      // NOTE: HomeExpense is NOT created here for repayments.
      // Loan repayments are balance sheet transactions (reducing a liability),
      // not operating expenses. They should not inflate the expense totals.

      await account.save();
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
  getAccountSummary,
};
