const EventOrder = require("../models/EventOrder");
const {
  updateInventoryFromOrder,
  revertInventory,
} = require("./inventoryController");
const { sendWhatsApp } = require("../utils/whatsappService");

const createEventOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        customerName,
        phone,
        purpose,
        address,
        deliveryDate,
        deliveryTime,
        items,
        payments,
      } = payload;
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const paidAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const newOrder = new EventOrder({
        customerName,
        phone,
        purpose,
        address,
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        items,
        payments,
        totalAmount,
        paidAmount,
      });

      const savedOrder = await newOrder.save();

      await updateInventoryFromOrder(items);

      // await sendWhatsApp(
      //   phone,
      //   `Event booking confirmed!\nAdvance: ₹${
      //     savedOrder.paidAmount
      //   }\nBalance: ₹${totalAmount - savedOrder.paidAmount}`,
      //   generateBookingReceipt(savedOrder)
      // );

      resolve({
        ...savedOrder.toObject(),
        bookingReceiptUrl: generateBookingReceiptUrl(savedOrder),
      });
    } catch (err) {
      console.log(err);

      reject({ status: 400, message: err.message });
    }
  });
};

const addPayment = (orderId, paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });

      order.payments.push(paymentData);
      const updatedOrder = await order.save();

      // Check if payment is complete
      if (updatedOrder.paymentStatus === "paid") {
        await sendWhatsApp(
          order.phone,
          `Final payment received!\nTotal: ₹${order.totalAmount}`,
          generateFinalInvoice(updatedOrder)
        );
      } else {
        await sendWhatsApp(
          order.phone,
          `Payment received: ₹${paymentData.amount}\nBalance: ₹${
            order.totalAmount - order.paidAmount
          }`
        );
      }
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateStatus = (orderId, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await EventOrder.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true }
      );
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
      }

      if (status === "delivered") {
        await sendWhatsApp(
          updatedOrder.phone,
          "Your order has been delivered! Thank you for your business."
        );
      }
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const getEventOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }
      resolve(order);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getAllEventOrders = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await EventOrder.find().sort({ deliveryDate: -1 });
      resolve(orders);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const updateEventOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await EventOrder.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
      }
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteEventOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }

      await revertInventory(order.items);
      await EventOrder.findByIdAndDelete(orderId);

      let message = `Your event order #${order._id} has been cancelled.`;
      if (order.paidAmount > 0) {
        message += ` ₹${order.paidAmount} will be refunded.`;
      }
      await sendWhatsApp(order.phone, message);

      resolve({ message: "Event order deleted successfully" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// Helper functions (remain as is, but can be moved to a separate utils file)
function generateBookingReceipt(order) {
  return `Booking receipt for ${order._id}`;
}

function generateFinalInvoice(order) {
  return `Final invoice for ${order._id}`;
}

function generateBookingReceiptUrl(order) {
  return `https://api.bharatisweets.com/receipts/event/${order._id}`;
}

module.exports = {
  createEventOrder,
  getAllEventOrders,
  getEventOrderById,
  addPayment,
  updateStatus,
  updateEventOrder,
  deleteEventOrder,
};
