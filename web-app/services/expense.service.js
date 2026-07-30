import { ExpenseRepository } from "../repositories/expense.repository";

export class ExpenseService {
  static async getAllExpenses() {
    return await ExpenseRepository.findAllExpenses();
  }

  static async createExpense(data) {
    return await ExpenseRepository.createExpense(data);
  }

  static async updateExpense(id, data) {
    return await ExpenseRepository.updateExpense(id, data);
  }

  static async deleteExpense(id) {
    return await ExpenseRepository.deleteExpense(id);
  }
}
