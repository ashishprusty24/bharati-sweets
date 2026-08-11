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
    const existingOrder = await EventOrder.findById(id);
    if (!existingOrder) throw new Error("Order not found");

    if (!data.payments || data.payments.length === 0) {
      if (existingOrder.payments && existingOrder.payments.length > 0) {
        data.payments = existingOrder.payments;
      } else if (data.advancePaid > 0 || data.advancePayment > 0) {
        const amt = Number(data.advancePaid || data.advancePayment || 0);
        data.payments = [{
          amount: amt,
          method: data.advancePaymentMethod || "cash",
          timestamp: new Date()
        }];
      }
    }

    const paidAmt = (data.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
      || Number(data.advancePaid || data.paidAmount || existingOrder.advancePaid || 0);

    data.advancePaid = paidAmt;
    data.paidAmount = paidAmt;

    return await EventOrder.findByIdAndUpdate(id, data, { new: true });
  }
}
