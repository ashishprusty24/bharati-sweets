import { NextResponse } from "next/server";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async getSummary(req) {
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get("period") || "30d";
      const data = await DashboardService.getSummary(period);
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async getSales(req) {
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get("period") || "30d";
      const data = await DashboardService.getSales(period);
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async getExpenses(req) {
    try {
      const data = await DashboardService.getExpenses();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async getPendingOrders(req) {
    try {
      const data = await DashboardService.getPendingOrders();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async getLowStockItems(req) {
    try {
      const data = await DashboardService.getLowStockItems();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async getReminders(req) {
    try {
      const data = await DashboardService.getReminders();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
