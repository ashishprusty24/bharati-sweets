import { NextResponse } from "next/server";
import { ExpenseService } from "../services/expense.service";

export class ExpenseController {
  static async getAllExpenses(req) {
    try {
      const expenses = await ExpenseService.getAllExpenses();
      return NextResponse.json(expenses);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createExpense(req) {
    try {
      const body = await req.json();
      const newExpense = await ExpenseService.createExpense(body);
      return NextResponse.json(newExpense, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateExpense(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await ExpenseService.updateExpense(id, body);
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteExpense(req, { params }) {
    try {
      const { id } = await params;
      const result = await ExpenseService.deleteExpense(id);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
