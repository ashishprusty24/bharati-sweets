const Expense = require("../models/Expense");

// GET all expenses
exports.getExpenses = () => {
  return new Promise((resolve, reject) => {
    Expense.find()
      .sort({ date: -1 })
      .then((expenses) => {
        resolve(expenses);
      })
      .catch((err) => {
        reject(new Error(err.message));
      });
  });
};

// CREATE a new expense
exports.createExpense = (data) => {
  return new Promise((resolve, reject) => {
    const newExpense = new Expense(data);
    newExpense
      .save()
      .then((savedExpense) => {
        resolve(savedExpense);
      })
      .catch((err) => {
        reject(new Error(err.message));
      });
  });
};

// UPDATE an existing expense
exports.updateExpense = (id, data) => {
  return new Promise((resolve, reject) => {
    Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .then((updatedExpense) => {
        if (!updatedExpense) {
          return reject(new Error("Expense not found"));
        }
        resolve(updatedExpense);
      })
      .catch((err) => {
        reject(new Error(err.message));
      });
  });
};

// DELETE an expense
exports.deleteExpense = (id) => {
  return new Promise((resolve, reject) => {
    Expense.findByIdAndDelete(id)
      .then((deletedExpense) => {
        if (!deletedExpense) {
          return reject(new Error("Expense not found"));
        }
        resolve(deletedExpense);
      })
      .catch((err) => {
        reject(new Error(err.message));
      });
  });
};
