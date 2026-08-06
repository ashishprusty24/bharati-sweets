const CreditCard = require("../models/CreditCard");
const Vendor = require("../models/Vendor");

const getAllCards = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cards = await CreditCard.find();
      resolve(cards);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getCardById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(id);
      if (!card) return reject({ status: 404, message: "Card not found" });
      resolve(card);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createCard = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = new CreditCard(data);
      const newCard = await card.save();
      resolve(newCard);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateCard = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findByIdAndUpdate(
        id,
        { cardName: data.cardName, last4Digits: data.last4Digits, cardType: data.cardType, creditLimit: data.creditLimit },
        { new: true, runValidators: true }
      );
      if (!card) return reject({ status: 404, message: "Card not found" });
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteCard = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await CreditCard.findByIdAndDelete(id);
      if (!result) return reject({ status: 404, message: "Card not found" });
      resolve(result);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// --- Transaction operations ---

const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");

const addTransaction = (cardId, txnData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

      const merchantName = (txnData.merchant || txnData.description || "").trim();
      const txDate = txnData.date ? new Date(txnData.date) : new Date();

      if (merchantName) {
        try {
          let vendor = await Vendor.findOne({ name: new RegExp("^" + merchantName + "$", "i") });
          if (!vendor) {
            vendor = new Vendor({
              name: merchantName,
              type: "other",
              contact: "Auto-created from Credit Card",
              address: "N/A",
              rate: 0,
            });
            await vendor.save();
          }

          if (vendor) {
            vendor.transactions.push({
              date: txDate,
              quantity: 1,
              amount: Number(txnData.amount) || 0,
              paymentMethod: "card",
              card: card._id,
            });
            vendor.lastPaymentDate = txDate;
            await vendor.save();
          }
        } catch (vErr) {
          console.error("Auto-vendor creation error in credit card transaction:", vErr);
        }
      }

      // Sync to HomeExpense
      try {
        const homeExp = new HomeExpense({
          date: txDate,
          description: merchantName ? `CC Payment: ${merchantName}` : "Credit Card Transaction",
          amount: Number(txnData.amount) || 0,
          category: "credit_card_bill",
          paymentSource: "bank_account",
          creditCardId: card._id,
        });
        await homeExp.save();
      } catch (hErr) {
        console.error("CC txn home expense sync error:", hErr);
      }

      // Sync to Daily Ledger
      try {
        const dayjs = require("dayjs");
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

        ledger.items.push({
          description: merchantName ? `CC Payment: ${merchantName}` : "Credit Card Transaction",
          amount: Number(txnData.amount) || 0,
          type: "expense",
          category: "credit_card_bill",
          paymentMode: "bank",
        });

        ledger.totalExpenses = ledger.items
          .filter((i) => i.type === "expense")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);

        await ledger.save();
      } catch (lErr) {
        console.error("CC txn daily ledger sync error:", lErr);
      }

      card.transactions.push(txnData);
      await card.save();
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteTransaction = (cardId, txnId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

      card.transactions.id(txnId).deleteOne();
      await card.save();
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// Get all transactions across all cards (for global view)
const getAllTransactions = (query = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cards = await CreditCard.find();
      let allTxns = [];

      cards.forEach((card) => {
        card.transactions.forEach((txn) => {
          allTxns.push({
            _id: txn._id,
            cardId: card._id,
            cardName: card.cardName,
            last4Digits: card.last4Digits,
            date: txn.date,
            description: txn.description,
            amount: txn.amount,
            category: txn.category,
            isSettled: txn.isSettled,
          });
        });
      });

      // Sort by date descending
      allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Filter by date range if provided
      if (query.startDate) {
        allTxns = allTxns.filter((t) => new Date(t.date) >= new Date(query.startDate));
      }
      if (query.endDate) {
        allTxns = allTxns.filter((t) => new Date(t.date) <= new Date(query.endDate));
      }

      resolve(allTxns);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// --- Bill Payment operations ---

const addBillPayment = (cardId, paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

      card.billPayments.push(paymentData);

      // Mark unsettled transactions up to the payment amount as settled
      let remaining = paymentData.amount;
      for (const txn of card.transactions) {
        if (!txn.isSettled && remaining > 0) {
          if (remaining >= txn.amount) {
            txn.isSettled = true;
            remaining -= txn.amount;
          } else {
            break; // Partial — don't mark as settled
          }
        }
      }

      await card.save();
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const getCardSummary = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cards = await CreditCard.find();

      const summary = cards.map((card) => ({
        _id: card._id,
        cardName: card.cardName,
        last4Digits: card.last4Digits,
        cardType: card.cardType,
        creditLimit: card.creditLimit,
        currentOutstanding: card.currentOutstanding,
        totalTransactions: card.transactions.length,
        unsettledCount: card.transactions.filter((t) => !t.isSettled).length,
        totalBillPayments: card.billPayments.reduce((s, p) => s + (p.amount || 0), 0),
      }));

      const totalOutstanding = summary.reduce((s, c) => s + c.currentOutstanding, 0);

      resolve({ cards: summary, totalOutstanding });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  addTransaction,
  deleteTransaction,
  getAllTransactions,
  addBillPayment,
  getCardSummary,
};
