import connectDB from "../database/mongodb";
import RegularOrder from "../models/RegularOrder";
import EventOrder from "../models/EventOrder";
import { sendWhatsApp } from "../utils/whatsappService";
import dayjs from "dayjs";

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

    const updatedOrder = await EventOrder.findByIdAndUpdate(id, data, { new: true });

    // Status change notification
    if (data.orderStatus && data.orderStatus !== existingOrder.orderStatus && updatedOrder.phone) {
      try {
        const dateStr = dayjs(updatedOrder.deliveryDate).format("DD MMM YYYY");
        const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
        const normStatus = (data.orderStatus || "").toLowerCase();
        let statusMsg = "";

        if (normStatus === "preparing") {
          statusMsg = `👨‍🍳 *Order Preparing - Bharati Sweets*\nHello *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is now being *PREPARED* by our chefs!\n\n📅 Delivery Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🙏`;
        } else if (normStatus === "ready") {
          statusMsg = `📦 *Order Ready - Bharati Sweets*\nGreat news *${updatedOrder.customerName}*! Your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is *READY FOR PICKUP / DELIVERY*!\n\n📅 Delivery Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🛵`;
        } else if (normStatus === "delivered" || normStatus === "completed") {
          statusMsg = `🎉 *Order Delivered - Bharati Sweets*\nDear *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* has been *DELIVERED & FULFILLED*!\n\nThank you for celebrating with Bharati Sweets! Have a wonderful event! 🙏`;
        } else if (normStatus === "pending" || normStatus === "confirmed") {
          statusMsg = `📋 *Order Confirmed - Bharati Sweets*\nHello *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is *CONFIRMED*.\n\n📅 Event Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🙏`;
        }

        if (statusMsg) {
          await sendWhatsApp(updatedOrder.phone, statusMsg);
        }
      } catch (err) {
        console.error("Failed to send status update WhatsApp in web-app:", err);
      }
    } else if (updatedOrder.phone) {
      // General order update notification
      try {
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;
        const dateStr = dayjs(updatedOrder.deliveryDate).format("DD MMM YYYY");
        const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
        const updateTextMsg = `📝 *Updated Order Invoice - Bharati Sweets*\nHello *${updatedOrder.customerName}*, your Event Order #${shortId} has been updated.\n\n• Event: ${updatedOrder.purpose || "Event"} (${dateStr})\n• Total Amount: ₹${updatedOrder.totalAmount.toLocaleString("en-IN")}\n• Paid Amount: ₹${updatedOrder.paidAmount.toLocaleString("en-IN")}\n• Balance Due: ₹${balance.toLocaleString("en-IN")}\n\nThank you for choosing Bharati Sweets! 🙏`;

        await sendWhatsApp(updatedOrder.phone, updateTextMsg);
      } catch (err) {
        console.error("Failed to send order update WhatsApp in web-app:", err);
      }
    }

    return updatedOrder;
  }
}
