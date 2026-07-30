import connectDB from "../database/mongodb";
import EventOrder from "../models/EventOrder";
import RegularOrder from "../models/RegularOrder";

export class CustomerRepository {
  static async getAggregatedCustomers() {
    await connectDB();
    const eventCustomers = await EventOrder.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          phone: { $last: "$customerPhone" },
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    const regularCustomers = await RegularOrder.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          phone: { $last: "$customerPhone" },
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    return { eventCustomers, regularCustomers };
  }
}
