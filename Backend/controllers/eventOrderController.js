const EventOrder = require("../models/EventOrder");
const inventoryController = require("./inventoryController");
const {
  generateBookingReceipt,
  generateFinalInvoice,
  generatePartialInvoice,
} = require("../utils/pdfService");
const { API_BASE_URL } = require("../common/config");
const { sendWhatsApp, sendWhatsAppDocument } = require("../utils/whatsappService");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper to ensure delivery date is always normalized to UTC midnight of the intended day in IST
const parseDeliveryDate = (d) => {
  if (!d) return new Date();
  const dayStr = dayjs(d).tz("Asia/Kolkata").format("YYYY-MM-DD");
  return new Date(`${dayStr}T00:00:00.000Z`);
};

// ─── CREATE EVENT ORDER ───────────────────────────────────────
const createEventOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        customerName, phone, spouseName, anniversaryDate, purpose, address, deliveryDate,
        deliveryTime, items = [], payments, discount = 0, packets = 1, totalAmount,
      } = payload;

      const itemsWithPackets = items.map((item) => ({
        ...item,
        finalQuantity: item.quantity * packets,
        finalTotal: (item.total - discount) * packets,
      }));

      const paidAmount = (payments || []).reduce((sum, p) => sum + p.amount, 0);

      const newOrder = new EventOrder({
        customerName, phone, purpose, address,
        deliveryDate: parseDeliveryDate(deliveryDate), deliveryTime,
        items: itemsWithPackets, payments: payments || [], discount, packets,
        totalAmount, paidAmount,
      });

      const savedOrder = await newOrder.save();

      await inventoryController.updateInventoryFromOrder(itemsWithPackets);

      // Generate booking receipt PDF
      await generateBookingReceipt(savedOrder);
      const bookingReceiptUrl = `${API_BASE_URL}/receipts/booking_${savedOrder._id}.pdf`;

      // 📲 WhatsApp: Send Booking Receipt PDF to customer
      if (savedOrder.phone) {
        try {
          const shortId = savedOrder._id.toString().slice(-6).toUpperCase();
          const dateStr = dayjs(savedOrder.deliveryDate).format("DD MMM YYYY");
          const balance = savedOrder.totalAmount - savedOrder.paidAmount;

          const caption = `🎉 *Booking Confirmed - Bharati Sweets*\n\nNamaste *${savedOrder.customerName}*!\nYour order #${shortId} for *${savedOrder.purpose || "Event"}* has been booked successfully.\n\n📅 Delivery: ${dateStr}\n💰 Total: ₹${savedOrder.totalAmount.toLocaleString("en-IN")}\n✅ Paid: ₹${savedOrder.paidAmount.toLocaleString("en-IN")}\n⏳ Balance: ₹${balance.toLocaleString("en-IN")}\n\nThank you for choosing Bharati Sweets! 🙏`;

          await sendWhatsAppDocument(
            savedOrder.phone,
            bookingReceiptUrl,
            `Booking_Receipt_${shortId}.pdf`,
            caption
          );
          console.log(`✅ Booking receipt WhatsApp sent to ${savedOrder.phone}`);
        } catch (waErr) {
          console.error("❌ Failed to send booking receipt WhatsApp:", waErr);
        }
      }

      resolve({
        ...savedOrder.toObject(),
        bookingReceiptUrl,
      });
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ─── ADD PAYMENT ──────────────────────────────────────────────
const addPayment = (orderId, paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });

      order.payments.push({
        ...paymentData,
        date: paymentData.date || new Date(),
      });
      order.paidAmount = order.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const updatedOrder = await order.save();

      const timestamp = Date.now();
      const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
      const dateStr = dayjs(updatedOrder.deliveryDate).format("DD MMM YYYY");
      const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;

      if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
        // ── FULL PAYMENT: Generate & send Final Invoice ──
        await generateFinalInvoice(updatedOrder);
        const invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;

        if (updatedOrder.phone) {
          try {
            const caption = `✅ *Full Payment Received - Bharati Sweets*\n\nNamaste *${updatedOrder.customerName}*!\nPayment of ₹${paymentData.amount.toLocaleString("en-IN")} received for Order #${shortId}.\n\n🎯 Event: ${updatedOrder.purpose || "Event"} (${dateStr})\n💰 Total Amount: ₹${updatedOrder.totalAmount.toLocaleString("en-IN")}\n✅ Fully Paid: ₹${updatedOrder.paidAmount.toLocaleString("en-IN")}\n\nPlease find your Final Invoice attached.\nThank you for choosing Bharati Sweets! 🙏`;

            await sendWhatsAppDocument(
              updatedOrder.phone,
              invoiceUrl,
              `Final_Invoice_${shortId}.pdf`,
              caption
            );
            console.log(`✅ Final invoice WhatsApp sent to ${updatedOrder.phone}`);
          } catch (waErr) {
            console.error("❌ Failed to send final invoice WhatsApp:", waErr);
          }
        }
      } else {
        // ── PARTIAL PAYMENT: Generate & send Partial Invoice ──
        await generatePartialInvoice(updatedOrder);
        const partialInvoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;

        if (updatedOrder.phone) {
          try {
            const caption = `💳 *Payment Received - Bharati Sweets*\n\nNamaste *${updatedOrder.customerName}*!\nPayment of ₹${paymentData.amount.toLocaleString("en-IN")} received for Order #${shortId}.\n\n🎯 Event: ${updatedOrder.purpose || "Event"} (${dateStr})\n💰 Total: ₹${updatedOrder.totalAmount.toLocaleString("en-IN")}\n✅ Paid: ₹${updatedOrder.paidAmount.toLocaleString("en-IN")}\n⏳ Balance Due: ₹${balance.toLocaleString("en-IN")}\n\nPlease find your updated invoice attached.\nThank you! 🙏`;

            await sendWhatsAppDocument(
              updatedOrder.phone,
              partialInvoiceUrl,
              `Partial_Invoice_${shortId}.pdf`,
              caption
            );
            console.log(`✅ Partial invoice WhatsApp sent to ${updatedOrder.phone}`);
          } catch (waErr) {
            console.error("❌ Failed to send partial invoice WhatsApp:", waErr);
          }
        }
      }

      // Also regenerate the booking receipt to reflect current balance
      await generateBookingReceipt(updatedOrder);
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ─── UPDATE ORDER STATUS ──────────────────────────────────────
const updateStatus = (orderId, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await EventOrder.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true }
      );
      if (!updatedOrder) return reject({ status: 404, message: "Order not found" });

      // 📲 Send real-time status update notification to customer via WhatsApp
      if (updatedOrder.phone) {
        try {
          const dateStr = dayjs(updatedOrder.deliveryDate).format("DD MMM YYYY");
          const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
          const normalizedStatus = (status || "").toLowerCase();
          let statusMsg = "";

          if (normalizedStatus === "preparing") {
            statusMsg = `👨‍🍳 *Order Preparing - Bharati Sweets*\nHello *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is now being *PREPARED* by our chefs!\n\n📅 Delivery Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🙏`;
          } else if (normalizedStatus === "ready") {
            statusMsg = `📦 *Order Ready - Bharati Sweets*\nGreat news *${updatedOrder.customerName}*! Your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is *READY FOR PICKUP / DELIVERY*!\n\n📅 Delivery Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🛵`;
          } else if (normalizedStatus === "delivered" || normalizedStatus === "completed") {
            statusMsg = `🎉 *Order Delivered - Bharati Sweets*\nDear *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* has been *DELIVERED & FULFILLED*!\n\nThank you for celebrating with Bharati Sweets! Have a wonderful event! 🙏`;
          } else if (normalizedStatus === "pending" || normalizedStatus === "confirmed") {
            statusMsg = `📋 *Order Confirmed - Bharati Sweets*\nHello *${updatedOrder.customerName}*, your Order #${shortId} for *${updatedOrder.purpose || "Event"}* is *CONFIRMED*.\n\n📅 Event Date: ${dateStr}\nThank you for choosing Bharati Sweets! 🙏`;
          }

          if (statusMsg) {
            await sendWhatsApp(updatedOrder.phone, statusMsg);
            console.log(`✅ WhatsApp status notification (${status}) sent to ${updatedOrder.phone}`);
          }
        } catch (waErr) {
          console.error("❌ Failed to send status update WhatsApp message:", waErr);
        }
      }

      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ─── GET ALL EVENT ORDERS ─────────────────────────────────────
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

// ─── GET EVENT ORDER BY ID ────────────────────────────────────
const getEventOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });
      resolve(order);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// ─── UPDATE EVENT ORDER ───────────────────────────────────────
const updateEventOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingOrder = await EventOrder.findById(orderId);
      if (!existingOrder) return reject({ status: 404, message: "Order not found" });

      if (updateData.deliveryDate) {
        updateData.deliveryDate = parseDeliveryDate(updateData.deliveryDate);
      }

      // Preserve existing payments or use updated payments array
      if (!updateData.payments || updateData.payments.length === 0) {
        if (existingOrder.payments && existingOrder.payments.length > 0) {
          updateData.payments = existingOrder.payments;
        } else if (updateData.advancePayment > 0 || updateData.advancePaid > 0) {
          const amt = Number(updateData.advancePayment || updateData.advancePaid || 0);
          updateData.payments = [{
            amount: amt,
            method: updateData.advancePaymentMethod || "cash",
            timestamp: new Date()
          }];
        }
      }

      // Calculate paidAmount accurately
      const paidAmount = (updateData.payments || []).reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      ) || Number(updateData.paidAmount || updateData.advancePaid || existingOrder.paidAmount || 0);

      updateData.paidAmount = paidAmount;
      const targetTotal = updateData.totalAmount !== undefined ? updateData.totalAmount : existingOrder.totalAmount;
      updateData.paymentStatus = (paidAmount >= targetTotal
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "pending");

      const updatedOrder = await EventOrder.findByIdAndUpdate(orderId, updateData, {
        new: true,
        runValidators: true,
      });

      // Regenerate appropriate invoice/receipt after update & send via WhatsApp
      try {
        const timestamp = Date.now();
        const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
        const dateStr = dayjs(updatedOrder.deliveryDate).format("DD MMM YYYY");
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;
        let invoiceUrl = "";

        if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
          await generateFinalInvoice(updatedOrder);
          invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;
        } else {
          await generatePartialInvoice(updatedOrder);
          invoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;
        }
        await generateBookingReceipt(updatedOrder);

        // 📲 WhatsApp: Send updated invoice PDF to customer
        if (updatedOrder.phone) {
          try {
            const invoiceType = updatedOrder.paidAmount >= updatedOrder.totalAmount ? "Final" : "Updated";
            const caption = `📝 *${invoiceType} Invoice - Bharati Sweets*\n\nNamaste *${updatedOrder.customerName}*!\nYour Event Order #${shortId} has been updated.\n\n🎯 Event: ${updatedOrder.purpose || "Event"} (${dateStr})\n💰 Total: ₹${updatedOrder.totalAmount.toLocaleString("en-IN")}\n✅ Paid: ₹${updatedOrder.paidAmount.toLocaleString("en-IN")}\n⏳ Balance: ₹${balance.toLocaleString("en-IN")}\n\nPlease find your ${invoiceType.toLowerCase()} invoice attached.\nThank you for choosing Bharati Sweets! 🙏`;

            await sendWhatsAppDocument(
              updatedOrder.phone,
              invoiceUrl,
              `${invoiceType}_Invoice_${shortId}.pdf`,
              caption
            );
            console.log(`✅ ${invoiceType} invoice WhatsApp sent to ${updatedOrder.phone}`);
          } catch (waErr) {
            console.error("❌ Failed to send updated invoice WhatsApp:", waErr);
          }
        }
      } catch (pdfErr) {
        console.error("PDF generation warning on order update:", pdfErr);
      }

      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

// ─── DELETE EVENT ORDER ───────────────────────────────────────
const deleteEventOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) return reject({ status: 404, message: "Order not found" });

      await inventoryController.revertInventory(order.items);
      await EventOrder.findByIdAndDelete(orderId);
      resolve({ message: "Event order deleted successfully" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

// ─── PREPARATION REPORT ──────────────────────────────────────
const getPreparationReport = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!date) return reject({ status: 400, message: "Date is required" });

      const tz = "Asia/Kolkata";
      const startDate = dayjs.tz(date, tz).startOf("day").utc().toDate();
      const endDate = dayjs.tz(date, tz).endOf("day").utc().toDate();

      const orders = await EventOrder.find({
        deliveryDate: { $gte: startDate, $lte: endDate },
      });

      if (orders.length === 0) return resolve([]);

      let totalPackets = 0;
      const itemTotals = {};

      orders.forEach((order) => {
        totalPackets += order.packets || 1;
        order.items.forEach((item) => {
          const key = item.name;
          if (!itemTotals[key]) {
            itemTotals[key] = { name: item.name, quantity: 0 };
          }
          itemTotals[key].quantity += item.quantity * (order.packets || 1);
        });
      });

      resolve([{
        deliveryDate: orders[0].deliveryDate,
        packets: totalPackets,
        items: Object.values(itemTotals),
      }]);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = {
  createEventOrder,
  getAllEventOrders,
  getEventOrderById,
  addPayment,
  updateStatus,
  updateEventOrder,
  deleteEventOrder,
  getPreparationReport,
};
