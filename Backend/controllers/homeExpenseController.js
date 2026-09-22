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

      // Auto assign default ccLoanId if paymentSource is cc_loan or category is cc_loan/cc_loan_repayment
      if ((data.paymentSource === "cc_loan" || data.category === "cc_loan" || data.category === "cc_loan_repayment") && !data.ccLoanId) {
        try {
          const defaultLoan = await CCLoan.findOne();
          if (defaultLoan) data.ccLoanId = defaultLoan._id;
        } catch (e) {
          console.error("Error finding default CCLoan:", e);
        }
      }

      // Auto assign default creditCardId if paymentSource is credit_card or category is credit_card_bill
      if ((data.paymentSource === "credit_card" || data.category === "credit_card_bill") && !data.creditCardId) {
        try {
          const defaultCard = await CreditCard.findOne();
          if (defaultCard) data.creditCardId = defaultCard._id;
        } catch (e) {
          console.error("Error finding default CreditCard:", e);
        }
      }

      const expense = new HomeExpense(data);
      const saved = await expense.save();

      // --- AUTO SYNC TO CREDIT CARD TRANSACTIONS / BILL PAYMENTS ---
      if (data.paymentSource === "credit_card" || data.category === "credit_card_bill") {
        try {
          const cardId = data.creditCardId?._id || data.creditCardId;
          const card = cardId ? await CreditCard.findById(cardId) : await CreditCard.findOne();
          if (card) {
            if (data.category === "credit_card_bill") {
              card.billPayments.push({
                date: data.date ? new Date(data.date) : new Date(),
                amount: Number(data.amount) || 0,
                paidFrom: data.paymentSource === "bank_account" ? "bank_account" : "home_cash",
                notes: data.notes || data.description || "Bill payment from Home Expense",
              });
            } else {
              card.transactions.push({
                date: data.date ? new Date(data.date) : new Date(),
                description: data.description || "Expense via Credit Card",
                amount: Number(data.amount) || 0,
                category: "business",
                isSettled: false,
              });
            }
            await card.save();
          }
        } catch (ccErr) {
          console.error("Credit card transaction sync error in homeExpense:", ccErr);
        }
      }

      // --- AUTO SYNC TO CC LOAN WITHDRAWALS / REPAYMENTS ---
      if (data.paymentSource === "cc_loan" || data.category === "cc_loan" || data.category === "cc_loan_repayment") {
        try {
          const loanId = data.ccLoanId?._id || data.ccLoanId;
          const ccAccount = loanId ? await CCLoan.findById(loanId) : await CCLoan.findOne();
          if (ccAccount) {
            if (data.category === "cc_loan_repayment") {
              ccAccount.repayments.push({
                date: data.date ? new Date(data.date) : new Date(),
                amount: Number(data.amount) || 0,
                paidFrom: data.paymentSource === "bank_account" ? "bank_account" : "home_cash",
                notes: data.notes || data.description || "Repayment via Home Expense",
              });
            } else {
              ccAccount.withdrawals.push({
                date: data.date ? new Date(data.date) : new Date(),
                description: data.description || "Withdrawal via Home Expense",
                amount: Number(data.amount) || 0,
                isRepaid: false,
              });
            }
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
      if (!oldExp) return reject({ status: 404, message: "Home expense not found" });

      // Clean IDs if passed as objects
      if (data.ccLoanId && typeof data.ccLoanId === "object") {
        data.ccLoanId = data.ccLoanId._id || data.ccLoanId.id;
      }
      if (data.creditCardId && typeof data.creditCardId === "object") {
        data.creditCardId = data.creditCardId._id || data.creditCardId.id;
      }

      // If updating to CC Loan and no ccLoanId is passed, find default CCLoan account
      if ((data.paymentSource === "cc_loan" || data.category === "cc_loan" || data.category === "cc_loan_repayment") && !data.ccLoanId) {
        try {
          const defaultLoan = await CCLoan.findOne();
          if (defaultLoan) data.ccLoanId = defaultLoan._id;
        } catch (e) {
          console.error("Error finding default CCLoan in update:", e);
        }
      }

      // If updating to Credit Card and no creditCardId is passed, find default CreditCard
      if ((data.paymentSource === "credit_card" || data.category === "credit_card_bill") && !data.creditCardId) {
        try {
          const defaultCard = await CreditCard.findOne();
          if (defaultCard) data.creditCardId = defaultCard._id;
        } catch (e) {
          console.error("Error finding default CreditCard in update:", e);
        }
      }

      // If updating vendor info
      if (data.description && !isIntakeCategory(data.category || oldExp.category)) {
        try {
          const vendorName = data.description.trim();
          let vendor = null;
          if (data.vendorId) {
            vendor = await Vendor.findById(data.vendorId);
          } else {
            vendor = await Vendor.findOne({ name: new RegExp("^" + vendorName + "$", "i") });
          }
          if (vendor) {
            data.vendorId = vendor._id;
          }
        } catch (vErr) {
          console.error("Auto-vendor update error:", vErr);
        }
      }

      // Determine previous state
      const oldIsLoan = oldExp.paymentSource === "cc_loan" || oldExp.category === "cc_loan" || oldExp.category === "cc_loan_repayment";
      const oldLoanId = (oldExp.ccLoanId?._id || oldExp.ccLoanId)?.toString();

      // Determine new state
      const newPaymentSource = data.paymentSource !== undefined ? data.paymentSource : oldExp.paymentSource;
      const newCategory = data.category !== undefined ? data.category : oldExp.category;
      const newIsLoan = newPaymentSource === "cc_loan" || newCategory === "cc_loan" || newCategory === "cc_loan_repayment";
      let newLoanId = (data.ccLoanId?._id || data.ccLoanId || (newIsLoan ? oldLoanId : null))?.toString();
      if (newIsLoan && !newLoanId) {
        const defaultLoan = await CCLoan.findOne();
        if (defaultLoan) {
          newLoanId = defaultLoan._id.toString();
          data.ccLoanId = defaultLoan._id;
        }
      }

      // Perform update on HomeExpense
      const updated = await HomeExpense.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("staffId", "name")
        .populate("vendorId", "name")
        .populate("creditCardId", "cardName last4Digits")
        .populate("ccLoanId", "accountName bankName accountNumber");

      // ─── SYNC CC LOAN CHANGES ───
      try {
        if (oldIsLoan && !newIsLoan) {
          // REMOVED from CC Loan: Remove withdrawal / repayment from CCLoan account
          let oldAccount = oldLoanId ? await CCLoan.findById(oldLoanId) : null;
          if (!oldAccount) {
            oldAccount = await CCLoan.findOne({
              $or: [
                { "withdrawals.amount": Number(oldExp.amount) },
                { "repayments.amount": Number(oldExp.amount) }
              ]
            });
          }
          if (oldAccount) {
            if (oldExp.category === "cc_loan_repayment") {
              const rpIdx = oldAccount.repayments.findIndex(
                (r) => Number(r.amount) === Number(oldExp.amount)
              );
              if (rpIdx > -1) {
                oldAccount.repayments.splice(rpIdx, 1);
                await oldAccount.save();
              }
            } else {
              const wdIdx = oldAccount.withdrawals.findIndex(
                (w) =>
                  Number(w.amount) === Number(oldExp.amount) &&
                  (w.description === oldExp.description ||
                    w.description === "Withdrawal via Home Expense" ||
                    dayjs(w.date).isSame(dayjs(oldExp.date), "day"))
              );
              const finalIdx = wdIdx > -1 ? wdIdx : oldAccount.withdrawals.findIndex((w) => Number(w.amount) === Number(oldExp.amount));
              if (finalIdx > -1) {
                oldAccount.withdrawals.splice(finalIdx, 1);
                await oldAccount.save();
              }
            }
          }
        } else if (!oldIsLoan && newIsLoan) {
          // ADDED to CC Loan: Add withdrawal / repayment to CCLoan account
          let newAccount = newLoanId ? await CCLoan.findById(newLoanId) : await CCLoan.findOne();
          if (newAccount) {
            if (newCategory === "cc_loan_repayment") {
              newAccount.repayments.push({
                date: updated.date ? new Date(updated.date) : new Date(),
                amount: Number(updated.amount) || 0,
                paidFrom: updated.paymentSource === "bank_account" ? "bank_account" : "home_cash",
                notes: updated.notes || updated.description || "Repayment via Home Expense",
              });
            } else {
              newAccount.withdrawals.push({
                date: updated.date ? new Date(updated.date) : new Date(),
                description: updated.description || "Withdrawal via Home Expense",
                amount: Number(updated.amount) || 0,
                isRepaid: false,
              });
            }
            await newAccount.save();
          }
        } else if (oldIsLoan && newIsLoan) {
          // REMAINED on CC Loan: Update or move withdrawal / repayment
          const sameAccount = oldLoanId && newLoanId && oldLoanId === newLoanId;
          let oldAccount = oldLoanId ? await CCLoan.findById(oldLoanId) : await CCLoan.findOne({ "withdrawals.amount": Number(oldExp.amount) });

          if (!sameAccount && oldLoanId && newLoanId) {
            // Account changed
            if (oldAccount) {
              const wdIdx = oldAccount.withdrawals.findIndex((w) => Number(w.amount) === Number(oldExp.amount));
              if (wdIdx > -1) {
                oldAccount.withdrawals.splice(wdIdx, 1);
                await oldAccount.save();
              }
            }
            const destAccount = await CCLoan.findById(newLoanId);
            if (destAccount) {
              destAccount.withdrawals.push({
                date: updated.date ? new Date(updated.date) : new Date(),
                description: updated.description || "Withdrawal via Home Expense",
                amount: Number(updated.amount) || 0,
                isRepaid: false,
              });
              await destAccount.save();
            }
          } else {
            // Same account: update existing entry
            let account = oldAccount || (newLoanId ? await CCLoan.findById(newLoanId) : await CCLoan.findOne());
            if (account) {
              const wd = account.withdrawals.find(
                (w) =>
                  Number(w.amount) === Number(oldExp.amount) &&
                  (w.description === oldExp.description ||
                    w.description === "Withdrawal via Home Expense" ||
                    dayjs(w.date).isSame(dayjs(oldExp.date), "day"))
              ) || account.withdrawals.find((w) => Number(w.amount) === Number(oldExp.amount));

              if (wd) {
                wd.amount = Number(updated.amount) || 0;
                wd.description = updated.description || wd.description;
                wd.date = updated.date ? new Date(updated.date) : wd.date;
                await account.save();
              } else {
                // If not found, create new withdrawal
                account.withdrawals.push({
                  date: updated.date ? new Date(updated.date) : new Date(),
                  description: updated.description || "Withdrawal via Home Expense",
                  amount: Number(updated.amount) || 0,
                  isRepaid: false,
                });
                await account.save();
              }
            }
          }
        }
      } catch (ccErr) {
        console.error("Error syncing CCLoan on expense update:", ccErr);
      }

      // ─── SYNC CREDIT CARD CHANGES ───
      const oldIsCC = oldExp.paymentSource === "credit_card" || oldExp.category === "credit_card_bill";
      const oldCardId = (oldExp.creditCardId?._id || oldExp.creditCardId)?.toString();
      const newIsCC = newPaymentSource === "credit_card" || newCategory === "credit_card_bill";
      let newCardId = (data.creditCardId?._id || data.creditCardId || (newIsCC ? oldCardId : null))?.toString();
      if (newIsCC && !newCardId) {
        const defaultCard = await CreditCard.findOne();
        if (defaultCard) {
          newCardId = defaultCard._id.toString();
          data.creditCardId = defaultCard._id;
        }
      }

      try {
        if (oldIsCC && !newIsCC) {
          let oldCard = oldCardId ? await CreditCard.findById(oldCardId) : await CreditCard.findOne({ "transactions.amount": Number(oldExp.amount) });
          if (oldCard) {
            const idx = oldCard.transactions.findIndex((t) => Number(t.amount) === Number(oldExp.amount));
            if (idx > -1) {
              oldCard.transactions.splice(idx, 1);
              await oldCard.save();
            }
          }
        } else if (!oldIsCC && newIsCC) {
          let newCard = newCardId ? await CreditCard.findById(newCardId) : await CreditCard.findOne();
          if (newCard) {
            newCard.transactions.push({
              date: updated.date ? new Date(updated.date) : new Date(),
              description: updated.description || "Expense via Credit Card",
              amount: Number(updated.amount) || 0,
              category: "business",
              isSettled: false,
            });
            await newCard.save();
          }
        } else if (oldIsCC && newIsCC) {
          const sameCard = oldCardId && newCardId && oldCardId === newCardId;
          let oldCard = oldCardId ? await CreditCard.findById(oldCardId) : await CreditCard.findOne({ "transactions.amount": Number(oldExp.amount) });
          if (!sameCard && oldCardId && newCardId) {
            if (oldCard) {
              const idx = oldCard.transactions.findIndex((t) => Number(t.amount) === Number(oldExp.amount));
              if (idx > -1) {
                oldCard.transactions.splice(idx, 1);
                await oldCard.save();
              }
            }
            const destCard = await CreditCard.findById(newCardId);
            if (destCard) {
              destCard.transactions.push({
                date: updated.date ? new Date(updated.date) : new Date(),
                description: updated.description || "Expense via Credit Card",
                amount: Number(updated.amount) || 0,
                category: "business",
                isSettled: false,
              });
              await destCard.save();
            }
          } else {
            let card = oldCard || (newCardId ? await CreditCard.findById(newCardId) : await CreditCard.findOne());
            if (card) {
              const txn = card.transactions.find((t) => Number(t.amount) === Number(oldExp.amount));
              if (txn) {
                txn.amount = Number(updated.amount) || 0;
                txn.description = updated.description || txn.description;
                txn.date = updated.date ? new Date(updated.date) : txn.date;
                await card.save();
              } else {
                card.transactions.push({
                  date: updated.date ? new Date(updated.date) : new Date(),
                  description: updated.description || "Expense via Credit Card",
                  amount: Number(updated.amount) || 0,
                  category: "business",
                  isSettled: false,
                });
                await card.save();
              }
            }
          }
        }
      } catch (ccErr) {
        console.error("Error syncing CreditCard on expense update:", ccErr);
      }

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

      // Cascade delete: Remove matching transaction or billPayment from CreditCard
      if (exp.creditCardId || exp.paymentSource === "credit_card" || exp.category === "credit_card_bill") {
        try {
          const cardId = exp.creditCardId?._id || exp.creditCardId;
          const card = cardId ? await CreditCard.findById(cardId) : await CreditCard.findOne({
            $or: [
              { "transactions.amount": Number(exp.amount) },
              { "billPayments.amount": Number(exp.amount) }
            ]
          });
          if (card) {
            if (exp.category === "credit_card_bill") {
              const bpIndex = card.billPayments.findIndex(
                (b) => Number(b.amount) === Number(exp.amount)
              );
              if (bpIndex > -1) {
                card.billPayments.splice(bpIndex, 1);
                await card.save();
              }
            } else {
              const txnIndex = card.transactions.findIndex(
                (t) =>
                  Number(t.amount) === Number(exp.amount) &&
                  (t.description === exp.description ||
                    t.description === `Expense via Credit Card` ||
                    exp.description?.includes(t.description) ||
                    t.description?.includes(exp.description?.replace(/^CC:\s*/i, "")) ||
                    dayjs(t.date).isSame(dayjs(exp.date), "day"))
              );
              const finalIdx = txnIndex > -1 ? txnIndex : card.transactions.findIndex((t) => Number(t.amount) === Number(exp.amount));
              if (finalIdx > -1) {
                card.transactions.splice(finalIdx, 1);
                await card.save();
              }
            }
          }
        } catch (ccErr) {
          console.error("Error cascade-deleting CreditCard transaction on expense delete:", ccErr);
        }
      }

      // Cascade delete: Remove matching withdrawal or repayment from CCLoan
      if (exp.ccLoanId || exp.paymentSource === "cc_loan" || exp.category === "cc_loan" || exp.category === "cc_loan_repayment") {
        try {
          const accountId = exp.ccLoanId?._id || exp.ccLoanId;
          const ccAccount = accountId ? await CCLoan.findById(accountId) : await CCLoan.findOne({
            $or: [
              { "withdrawals.amount": Number(exp.amount) },
              { "repayments.amount": Number(exp.amount) }
            ]
          });
          if (ccAccount) {
            if (exp.category === "cc_loan_repayment") {
              const rpIndex = ccAccount.repayments.findIndex(
                (r) => Number(r.amount) === Number(exp.amount)
              );
              if (rpIndex > -1) {
                ccAccount.repayments.splice(rpIndex, 1);
                await ccAccount.save();
              }
            } else {
              const wdIndex = ccAccount.withdrawals.findIndex(
                (w) =>
                  Number(w.amount) === Number(exp.amount) &&
                  (w.description === exp.description ||
                    w.description === `Withdrawal via Home Expense` ||
                    exp.description?.includes(w.description) ||
                    w.description?.includes(exp.description?.replace(/^CC Loan:\s*/i, "")) ||
                    dayjs(w.date).isSame(dayjs(exp.date), "day"))
              );
              const finalIdx = wdIndex > -1 ? wdIndex : ccAccount.withdrawals.findIndex((w) => Number(w.amount) === Number(exp.amount));
              if (finalIdx > -1) {
                ccAccount.withdrawals.splice(finalIdx, 1);
                await ccAccount.save();
              }
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
