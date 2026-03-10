const RegularOrder = require("../models/RegularOrder");
const inventoryController = require("./inventoryController");

const createRegularOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { customerName, phone, items, payment } = payload;
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      await inventoryController.updateInventoryFromOrder(items);

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
      resolve(savedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const getAllRegularOrders = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await RegularOrder.find().sort({ createdAt: -1 });
      resolve(orders);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getRegularOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });
      resolve(order);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const updateRegularOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await RegularOrder.findByIdAndUpdate(orderId, updateData, {
        new: true,
      });
      if (!updatedOrder) return reject({ status: 404, message: "Order not found" });
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteRegularOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });

      await inventoryController.revertInventory(order.items);
      await RegularOrder.findByIdAndDelete(orderId);
      resolve({ message: "Order deleted successfully" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  createRegularOrder,
  getAllRegularOrders,
  getRegularOrderById,
  updateRegularOrder,
  deleteRegularOrder,
};
