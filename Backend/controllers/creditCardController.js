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

      // Sync to HomeExpense with paymentSource = "credit_card"
      // Visible in expenses table, but excluded from net profit & daily ledger until bill is paid!
      try {
        const desc = merchantName ? `CC: ${merchantName}` : (txnData.description || "Credit Card Transaction");
        const homeExp = new HomeExpense({
          date: txDate,
          description: desc,
          amount: Number(txnData.amount) || 0,
          category: txnData.category === "vendor_payment" ? "supplier_payment" : (txnData.category || "credit_card"),
          paymentSource: "credit_card",
          creditCardId: card._id,
        });
        await homeExp.save();
      } catch (hErr) {
        console.error("CC txn home expense sync error:", hErr);
      }

      card.transactions.push(txnData);
      await card.save();
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const dayjs = require("dayjs");

const deleteTransaction = (cardId, txnId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

      const txn = card.transactions.id(txnId);
      if (txn) {
        // Cascade delete corresponding HomeExpense
        try {
          const HomeExpense = require("../models/HomeExpense");
          const targetDate = dayjs(txn.date).startOf("day").toDate();
          const nextDay = dayjs(txn.date).endOf("day").toDate();
          await HomeExpense.findOneAndDelete({
            creditCardId: card._id,
            amount: txn.amount,
            date: { $gte: targetDate, $lte: nextDay },
          });
        } catch (hErr) {
          console.error("Failed to delete matching HomeExpense on CC transaction delete:", hErr);
        }
        card.transactions.pull(txnId);
      }

      await card.save();
      resolve(card);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteBillPayment = (cardId, paymentId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = await CreditCard.findById(cardId);
      if (!card) return reject({ status: 404, message: "Card not found" });

      const payment = card.billPayments.id(paymentId);
      if (payment) {
        const pDate = payment.date ? new Date(payment.date) : new Date();
        const pAmount = payment.amount;

        // Cascade delete corresponding HomeExpense
        try {
          const HomeExpense = require("../models/HomeExpense");
          const targetDate = dayjs(pDate).startOf("day").toDate();
          const nextDay = dayjs(pDate).endOf("day").toDate();
          await HomeExpense.findOneAndDelete({
            creditCardId: card._id,
            amount: pAmount,
            category: "credit_card_bill",
            date: { $gte: targetDate, $lte: nextDay },
          });
        } catch (hErr) {
          console.error("Failed to delete matching HomeExpense on CC bill payment delete:", hErr);
        }

        card.billPayments.pull(paymentId);
      }

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

      const txDate = paymentData.date ? new Date(paymentData.date) : new Date();
      const totalAmount = Number(paymentData.amount) || 0;
      const paidFrom = paymentData.paidFrom || "bank_account";
      const notes = (paymentData.notes || "").trim();

      card.billPayments.push({
        date: txDate,
        amount: totalAmount,
        paidFrom,
        notes,
      });

      // Mark unsettled transactions up to the payment amount as settled
      let remaining = totalAmount;
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

      // Sync to HomeExpense: Bill payment is paid from home_cash or bank_account, so it DOES affect net profit!
      try {
        const HomeExpense = require("../models/HomeExpense");
        await HomeExpense.create({
          description: `Credit Card Bill: ${card.cardName} (Ending ${card.last4Digits})`,
          amount: totalAmount,
          date: txDate,
          category: "credit_card_bill",
          paymentSource: paidFrom,
          creditCardId: card._id,
          sourceTag: "direct",
          notes: notes || `Bill payment from ${paidFrom === "home_cash" ? "Home Cash" : "Bank Account"}`,
        });
      } catch (hErr) {
        console.error("Failed to sync CC bill payment to HomeExpense:", hErr);
      }

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
  deleteBillPayment,
  getCardSummary,
};
