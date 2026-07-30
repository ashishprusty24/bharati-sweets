import { DashboardController } from "../../../../controllers/dashboard.controller";

export async function GET(req, ctx) {
  return DashboardController.getPendingOrders(req, ctx);
}
