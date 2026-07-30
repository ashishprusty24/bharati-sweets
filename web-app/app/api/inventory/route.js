import { InventoryController } from "../../../controllers/inventory.controller";

export async function GET(req, ctx) {
  return InventoryController.getItems(req, ctx);
}

export async function POST(req, ctx) {
  return InventoryController.createItem(req, ctx);
}
