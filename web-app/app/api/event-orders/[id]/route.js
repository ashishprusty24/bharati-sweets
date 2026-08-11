import { OrderController } from "../../../../controllers/order.controller";

export async function PUT(req, ctx) {
  return OrderController.updateEventOrder(req, ctx);
}

export async function DELETE(req, ctx) {
  return OrderController.deleteEventOrder ? OrderController.deleteEventOrder(req, ctx) : new Response(JSON.stringify({ message: "Not implemented" }), { status: 501 });
}
