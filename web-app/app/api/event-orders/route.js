import { OrderController } from "../../../controllers/order.controller";

export async function GET(req, ctx) {
  return OrderController.getEventOrders(req, ctx);
}

export async function POST(req, ctx) {
  return OrderController.createEventOrder(req, ctx);
}
