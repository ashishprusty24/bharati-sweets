import { DashboardController } from "../../../../controllers/dashboard.controller";

export async function GET(req, ctx) {
  return DashboardController.getSummary(req, ctx);
}
