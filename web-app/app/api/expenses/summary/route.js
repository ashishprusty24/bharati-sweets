import { ExpenseController } from "../../../../controllers/expense.controller";

export async function GET(req, ctx) {
  return ExpenseController.getExpenseSummary(req, ctx);
}
