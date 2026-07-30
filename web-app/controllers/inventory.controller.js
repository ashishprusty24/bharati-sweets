import { NextResponse } from "next/server";
import { InventoryService } from "../services/inventory.service";

export class InventoryController {
  static async getItems(req) {
    try {
      const items = await InventoryService.getItems();
      return NextResponse.json(items);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createItem(req) {
    try {
      const body = await req.json();
      const newItem = await InventoryService.createItem(body);
      return NextResponse.json(newItem, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateItem(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await InventoryService.updateItem(id, body);
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteItem(req, { params }) {
    try {
      const { id } = await params;
      const result = await InventoryService.deleteItem(id);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
