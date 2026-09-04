require("dotenv").config();
const connectDB = require("../config/db");
const eventOrderController = require("../controllers/eventOrderController");
const EventOrder = require("../models/EventOrder");

async function testOrderUpdateWhatsApp() {
  await connectDB();
  console.log("Searching for existing event order to test update...");
  let order = await EventOrder.findOne().sort({ createdAt: -1 });

  if (!order) {
    console.log("No existing order found. Creating test event order...");
    order = await EventOrder.create({
      customerName: "Ashish Test",
      phone: "919876543210",
      eventDate: new Date(),
      deliveryDate: new Date(),
      purpose: "Marriage",
      items: [{ itemName: "Gulab Jamun", quantity: 10, unit: "kg", price: 200, amount: 2000 }],
      totalAmount: 2000,
      paidAmount: 500,
      paymentStatus: "partial",
      orderStatus: "booked",
    });
  }

  console.log(`Testing update for Order ID: ${order._id} (Phone: ${order.phone})...`);
  try {
    const res = await eventOrderController.updateEventOrder(order._id, {
      items: order.items,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      notes: "Test update for WhatsApp message",
    });
    console.log("✅ Order update completed successfully!");
  } catch (err) {
    console.error("❌ Order update error:", err);
  }

  process.exit(0);
}

testOrderUpdateWhatsApp();
