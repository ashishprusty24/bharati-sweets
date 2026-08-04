// controllers/vendorController.js
const Vendor = require("../models/Vendor");

const getAllVendors = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendors = await Vendor.find();
      resolve(vendors);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createVendor = (payload) => {
  return new Promise(async (resolve, reject) => {
    const vendor = new Vendor(payload);
    try {
      const newVendor = await vendor.save();
      resolve(newVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateVendor = (vendorId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedVendor) {
        return reject({ status: 404, message: "Vendor not found" });
      }
      resolve(updatedVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteVendor = (vendorId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Vendor.findByIdAndDelete(vendorId);
      if (!result) {
        return reject({ status: 404, message: "Vendor not found" });
      }
      resolve({ message: "Vendor deleted" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");

const makePayment = (vendorId, paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return reject({ status: 404, message: "Vendor not found" });
      }

      const txDate = paymentData.date ? new Date(paymentData.date) : new Date();
      const newTx = {
        ...paymentData,
        date: txDate,
      };

      vendor.transactions.push(newTx);
      vendor.paymentDue -= paymentData.amount;
      vendor.lastPaymentDate = txDate;

      const updatedVendor = await vendor.save();

      const isBank = ["phonepe", "gpay", "paytm", "card", "bank"].includes(
        (paymentData.paymentMethod || "").toLowerCase()
      );

      // 1. Sync to HomeExpense
      try {
        const homeExp = new HomeExpense({
          date: txDate,
          description: `Vendor Payment: ${vendor.name}`,
          amount: Number(paymentData.amount) || 0,
          category: "supplier_payment",
          paymentSource: isBank ? "bank_account" : "home_cash",
          vendorId: vendor._id,
        });
        await homeExp.save();
      } catch (hErr) {
        console.error("Vendor payment home expense sync failed:", hErr);
      }

      // 2. Sync payment to Daily Ledger for that date
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
          description: `Vendor Payment: ${vendor.name}`,
          amount: Number(paymentData.amount) || 0,
          type: "expense",
          category: "supplier_payment",
          vendorId: vendor._id,
          paymentMode: isBank ? "bank" : "cash",
        });

        ledger.totalExpenses = ledger.items
          .filter((i) => i.type === "expense")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);

        await ledger.save();
      } catch (syncErr) {
        console.error("Vendor payment ledger sync failed:", syncErr);
      }

      // 3. Sync to CreditCard model if paid via Card
      if (paymentData.paymentMethod === "card" && paymentData.card) {
        try {
          const CreditCard = require("../models/CreditCard");
          const card = await CreditCard.findById(paymentData.card);
          if (card) {
            card.transactions.push({
              date: txDate,
              description: `Payment to Vendor: ${vendor.name}`,
              amount: Number(paymentData.amount) || 0,
              category: "supplier_payment",
              isSettled: false,
            });
            await card.save();
          }
        } catch (cErr) {
          console.error("Vendor payment credit card sync failed:", cErr);
        }
      }

      resolve(updatedVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  makePayment,
};
