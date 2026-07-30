import connectDB from "../database/mongodb";
import Expense from "../models/Expense";
import HomeExpense from "../models/HomeExpense";

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
    const expense = new HomeExpense(data);
    const saved = await expense.save();
    return await HomeExpense.findById(saved._id)
      .populate("staffId", "name")
      .populate("vendorId", "name")
      .populate("creditCardId", "cardName last4Digits");
  }
}
