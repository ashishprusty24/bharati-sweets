import connectDB from "../database/mongodb";
import RegularOrder from "../models/RegularOrder";
import EventOrder from "../models/EventOrder";

export class OrderRepository {
  static async findRegularOrders(query = {}) {
    await connectDB();
    return await RegularOrder.find(query).sort({ orderDate: -1 });
  }

  static async createRegularOrder(data) {
    await connectDB();
    const order = new RegularOrder(data);
    return await order.save();
  }

  static async findEventOrders(query = {}) {
    await connectDB();
    return await EventOrder.find(query).sort({ createdAt: -1 });
  }

  static async createEventOrder(data) {
    await connectDB();
    // Idempotency check to prevent duplicate order generation
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existing = await EventOrder.findOne({
      customerName: data.customerName,
      totalAmount: data.totalAmount,
      createdAt: { $gte: fiveSecondsAgo },
    });
    if (existing) {
      return existing;
    }
    const order = new EventOrder(data);
    return await order.save();
  }

  static async updateEventOrder(id, data) {
    await connectDB();
    return await EventOrder.findByIdAndUpdate(id, data, { new: true });
  }
}
