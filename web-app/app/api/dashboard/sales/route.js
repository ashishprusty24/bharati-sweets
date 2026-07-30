import { DashboardController } from "../../../../controllers/dashboard.controller";

export async function GET(req, ctx) {
  return DashboardController.getSales(req, ctx);
}
