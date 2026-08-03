import connectDB from "../database/mongodb";
import Expense from "../models/Expense";
import HomeExpense from "../models/HomeExpense";
import Vendor from "../models/Vendor";

export class ExpenseRepository {
  static async findAllExpenses() {
    await connectDB();
    return await Expense.find().sort({ date: -1 });
  }

  static async createExpense(data) {
    await connectDB();
    const expense = new Expense(data);
    return await expense.save();
  }

  static async updateExpense(id, data) {
    await connectDB();
    return await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  static async deleteExpense(id) {
    await connectDB();
    return await Expense.findByIdAndDelete(id);
  }

  // Home Expenses
  static async findHomeExpenses(filter = {}) {
    await connectDB();
    return await HomeExpense.find(filter)
      .populate("staffId", "name")
      .populate("vendorId", "name")
      .populate("creditCardId", "cardName last4Digits")
      .sort({ date: -1 });
  }

  static async createHomeExpense(data) {
    await connectDB();

    if (data.description && data.category !== "personal") {
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
        console.error("Auto-vendor creation error in web-app createHomeExpense:", vErr);
      }
    }

    const expense = new HomeExpense(data);
    const saved = await expense.save();
    return await HomeExpense.findById(saved._id)
      .populate("staffId", "name")
      .populate("vendorId", "name")
      .populate("creditCardId", "cardName last4Digits");
  }
}
