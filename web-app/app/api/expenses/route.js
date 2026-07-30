import { ExpenseController } from "../../../controllers/expense.controller";

export async function GET(req, ctx) {
  return ExpenseController.getAllExpenses(req, ctx);
}

export async function POST(req, ctx) {
  return ExpenseController.createExpense(req, ctx);
}
