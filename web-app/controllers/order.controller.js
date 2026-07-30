import { NextResponse } from "next/server";
import { OrderService } from "../services/order.service";

export class OrderController {
  static async getRegularOrders(req) {
    try {
      const orders = await OrderService.getRegularOrders();
      return NextResponse.json(orders);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createRegularOrder(req) {
    try {
      const body = await req.json();
      const newOrder = await OrderService.createRegularOrder(body);
      return NextResponse.json(newOrder, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async getEventOrders(req) {
    try {
      const orders = await OrderService.getEventOrders();
      return NextResponse.json(orders);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createEventOrder(req) {
    try {
      const body = await req.json();
      const newOrder = await OrderService.createEventOrder(body);
      return NextResponse.json(newOrder, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateEventOrder(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await OrderService.updateEventOrder(id, body);
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }
}
