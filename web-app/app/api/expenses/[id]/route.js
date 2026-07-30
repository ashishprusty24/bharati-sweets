import { ExpenseController } from "../../../../controllers/expense.controller";

export async function PUT(req, ctx) {
  return ExpenseController.updateExpense(req, ctx);
}

export async function DELETE(req, ctx) {
  return ExpenseController.deleteExpense(req, ctx);
}
