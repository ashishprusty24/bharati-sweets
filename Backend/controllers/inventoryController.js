const Inventory = require("../models/Inventory");

const getAllInventory = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const inventory = await Inventory.find();
      resolve(inventory);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createInventoryItem = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = new Inventory(payload);
      const newItem = await item.save();
      resolve(newItem);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateInventoryItem = (itemId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Update the item first
      let updatedItem = await Inventory.findByIdAndUpdate(itemId, updateData, {
        new: true,
      });

      if (!updatedItem) {
        return reject({ status: 404, message: "Inventory item not found" });
      }

      // Auto-update stock status
      let newStatus = "in-stock";

      if (updatedItem.quantity <= 0) {
        newStatus = "out-of-stock";
      } else if (updatedItem.quantity <= updatedItem.minStock) {
        newStatus = "low-stock";
      }

      if (updatedItem.status !== newStatus) {
        updatedItem = await Inventory.findByIdAndUpdate(
          updatedItem._id,
          { status: newStatus, lastUpdated: new Date() },
          { new: true }
        );
      }

      resolve(updatedItem);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteInventoryItem = (itemId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Inventory.findByIdAndDelete(itemId);
      if (!result) {
        return reject({ status: 404, message: "Inventory item not found" });
      }
      resolve({ message: "Inventory item deleted" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const updateInventoryFromOrder = (orderItems) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const item of orderItems) {
        // Pick finalQuantity if available, else fall back to quantity
        const quantityToDeduct =
          item.finalQuantity !== undefined && item.finalQuantity !== null
            ? -item.finalQuantity
            : -item.quantity;

        const updatedItem = await Inventory.findByIdAndUpdate(
          item.itemId,
          { $inc: { quantity: quantityToDeduct } },
          { new: true } // return updated document
        );

        if (updatedItem) {
          let newStatus = "in-stock";

          if (updatedItem.quantity <= 0) {
            newStatus = "out-of-stock";
          } else if (updatedItem.quantity <= updatedItem.minStock) {
            newStatus = "low-stock";
          }

          if (updatedItem.status !== newStatus) {
            await Inventory.findByIdAndUpdate(updatedItem._id, {
              status: newStatus,
              lastUpdated: new Date(),
            });
          }
        }
      }
      resolve();
    } catch (err) {
      console.error("Error updating inventory:", err);
      reject({ status: 500, message: "Error updating inventory" });
    }
  });
};

const revertInventory = (orderItems) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const item of orderItems) {
        await Inventory.findByIdAndUpdate(item.itemId, {
          $inc: { quantity: item.quantity },
        });
      }
      resolve();
    } catch (err) {
      console.error("Error reverting inventory:", err);
      reject({ status: 500, message: "Error reverting inventory" });
    }
  });
};

module.exports = {
  getAllInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateInventoryFromOrder,
  revertInventory,
};
