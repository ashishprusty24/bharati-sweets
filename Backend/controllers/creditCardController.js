const CreditCard = require("../models/CreditCard");

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

const addTransaction = (cardId, txnData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

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
