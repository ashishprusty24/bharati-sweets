const Expense = require("../models/Expense");

const getExpenses = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const expenses = await Expense.find().sort({ date: -1 });
      resolve(expenses);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createExpense = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newExpense = new Expense(data);
      const savedExpense = await newExpense.save();
      resolve(savedExpense);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateExpense = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedExpense = await Expense.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!updatedExpense) return reject({ status: 404, message: "Expense not found" });
      resolve(updatedExpense);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteExpense = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Expense.findByIdAndDelete(id);
      if (!result) return reject({ status: 404, message: "Expense not found" });
      resolve(result);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
