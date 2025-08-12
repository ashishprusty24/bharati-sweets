// routes/orderRoutes.js
const express = require("express");
const {
  createEventOrder,
  getRegularOrderById,
  deleteRegularOrder,
  createRegularOrder,
  getAllRegularOrders,
  updateRegularOrder,
} = require("../controllers/regularOrderController");
const router = express.Router();

router.get("/list", async (req, res) => {
  try {
    const orders = await getAllRegularOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Error fetching orders", error });
  }
});

router.post("/create", async (req, res) => {
  try {
    const savedOrder = await createRegularOrder(req.body);
    console.log(savedOrder);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.log(error);

    res.status(400).json({ message: "Error creating order", error });
  }
});

router.put("/:id/update", async (req, res) => {
  try {
    const { items, ...updateData } = req.body;
    const orderId = req.params.id;
    const updatedOrder = await updateRegularOrder(orderId, updateData);
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ data: updatedOrder });
  } catch (error) {
    res.status(400).json({ message: "Error updating order", error });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await deleteRegularOrder(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
});

module.exports = router;
