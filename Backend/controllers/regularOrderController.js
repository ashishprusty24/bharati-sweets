const RegularOrder = require("../models/RegularOrder");
const {
  updateInventory,
  revertInventory,
  updateInventoryFromOrder,
} = require("./inventoryController");
const { sendWhatsApp } = require("../utils/whatsappService");

const createRegularOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { customerName, phone, items, payment } = payload;
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Await inventory update
      await updateInventoryFromOrder(items);

      const newOrder = new RegularOrder({
        customerName,
        phone,
        items,
        payment: {
          ...payment,
          amount: totalAmount,
        },
      });

      const savedOrder = await newOrder.save();

      // You can uncomment this to send a WhatsApp message
      // await sendWhatsApp(
      //   phone,
      //   `Your order #${savedOrder._id} is confirmed!\nTotal: ₹${totalAmount}`,
      //   generateInvoice(savedOrder)
      // );

      resolve({
        ...savedOrder.toObject(),
        invoiceUrl: generateInvoiceUrl(savedOrder),
      });
    } catch (err) {
      reject(err);
    }
  });
};

const getAllRegularOrders = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await RegularOrder.find().sort({ createdAt: -1 });
      resolve(orders);
    } catch (err) {
      reject(err);
    }
  });
};

const getRegularOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }
      resolve(order);
    } catch (err) {
      reject(err);
    }
  });
};

const updateRegularOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (updateData.items || updateData.payment) {
        return reject({
          status: 400,
          message: "Items and payment cannot be modified after creation",
        });
      }

      const updatedOrder = await RegularOrder.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
      }

      console.log(updatedOrder);

      resolve(updatedOrder);
    } catch (err) {
      reject(err);
    }
  });
};

const deleteRegularOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }

      await revertInventory(order.items);
      await RegularOrder.findByIdAndDelete(orderId);

      // await sendWhatsApp(
      //   order.phone,
      //   `Your order #${order._id} has been cancelled. ₹${order.payment.amount} will be refunded.`
      // );

      resolve({ message: "Order deleted successfully" });
    } catch (err) {
      console.log(err);

      reject(err);
    }
  });
};

function generateInvoiceUrl(order) {
  return `https://api.bharatisweets.com/invoices/regular/${order._id}`;
}

module.exports = {
  createRegularOrder,
  getAllRegularOrders,
  getRegularOrderById,
  updateRegularOrder,
  deleteRegularOrder,
};
