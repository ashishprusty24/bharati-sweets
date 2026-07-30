import { OrderController } from "../../../controllers/order.controller";

export async function GET(req, ctx) {
  return OrderController.getRegularOrders(req, ctx);
}

export async function POST(req, ctx) {
  return OrderController.createRegularOrder(req, ctx);
}
