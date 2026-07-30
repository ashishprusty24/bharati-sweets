import { DashboardRepository } from "../repositories/dashboard.repository";

export class DashboardService {
  static async getSummary(period = "30d") {
    const today = new Date();
    const startDate = new Date();
    if (period === "2y") {
      startDate.setFullYear(today.getFullYear() - 2);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    return await DashboardRepository.getMetrics(startDate);
  }

  static async getSales(period = "30d") {
    const today = new Date();
    const startDate = new Date();
    if (period === "2y") {
      startDate.setFullYear(today.getFullYear() - 2);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    return await DashboardRepository.getSalesTrend(startDate, period);
  }

  static async getExpenses() {
    return await DashboardRepository.getExpenseBreakdown();
  }

  static async getPendingOrders() {
    return await DashboardRepository.getPendingOrders();
  }

  static async getLowStockItems() {
    return await DashboardRepository.getLowStockItems();
  }

  static async getReminders() {
    return await DashboardRepository.getReminders();
  }
}
