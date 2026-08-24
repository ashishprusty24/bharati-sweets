const EventOrder = require("../models/EventOrder");
const inventoryController = require("./inventoryController");
const {
  generateBookingReceipt,
  generateFinalInvoice,
  generatePartialInvoice,
} = require("../utils/pdfService");
const { API_BASE_URL } = require("../common/config");
const { sendWhatsApp, sendWhatsAppDocument, sendWhatsAppTemplate } = require("../utils/whatsappService");
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

      // 📲 Send Meta Template booking_receipt
      if (savedOrder.phone) {
        try {
          const components = [
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    link: bookingReceiptUrl,
                    filename: `booking_${savedOrder._id}.pdf`,
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: savedOrder.customerName },
                { type: "text", text: `${savedOrder._id}` },
                { type: "text", text: savedOrder.purpose || "Event" },
                { type: "text", text: `${savedOrder.paidAmount}` },
                { type: "text", text: `${savedOrder.totalAmount}` },
                { type: "text", text: `₹${savedOrder.totalAmount - savedOrder.paidAmount}` },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: `receipts/booking_${savedOrder._id}.pdf`,
                },
              ],
            },
          ];

          const sent = await sendWhatsAppTemplate(savedOrder.phone, "booking_receipt", components);
          if (!sent) {
            console.log("⚠️ Template send failed, attempting direct WhatsApp Document fallback...");
            const shortId = savedOrder._id.toString().slice(-6).toUpperCase();
            const caption = `🎉 *Booking Confirmed - Bharati Sweets*\nNamaste *${savedOrder.customerName}*!\nYour order #${shortId} has been booked.`;
            await sendWhatsAppDocument(savedOrder.phone, bookingReceiptUrl, `booking_${savedOrder._id}.pdf`, caption);
          }
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

      if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
        // ── FULL PAYMENT: Generate & send Final Invoice ──
        let invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;
        try {
          await generateFinalInvoice(updatedOrder);
        } catch (pdfErr) {
          console.error("⚠️ Final invoice PDF generation failed (WhatsApp will still be attempted):", pdfErr.message);
        }

        if (updatedOrder.phone) {
          try {
            const components = [
              {
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: {
                      link: invoiceUrl,
                      filename: `final_${updatedOrder._id}.pdf`,
                    },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: updatedOrder.customerName },
                  { type: "text", text: `${updatedOrder._id}` },
                  { type: "text", text: updatedOrder.purpose || "Event" },
                  { type: "text", text: `${updatedOrder.totalAmount}` },
                  { type: "text", text: `${updatedOrder.paidAmount}` },
                ],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                  {
                    type: "text",
                    text: `receipts/final_${updatedOrder._id}.pdf`,
                  },
                ],
              },
            ];

            const sent = await sendWhatsAppTemplate(updatedOrder.phone, "final_invoice", components);
            if (!sent) {
              const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
              const caption = `✅ *Full Payment Received - Bharati Sweets*\nNamaste *${updatedOrder.customerName}*! Order #${shortId} is fully paid.`;
              await sendWhatsAppDocument(updatedOrder.phone, invoiceUrl, `final_${updatedOrder._id}.pdf`, caption);
            }
          } catch (waErr) {
            console.error("❌ Failed to send final invoice WhatsApp:", waErr);
          }
        }
      } else {
        // ── PARTIAL PAYMENT: Generate & send Partial Invoice ──
        let partialInvoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;
        try {
          await generatePartialInvoice(updatedOrder);
        } catch (pdfErr) {
          console.error("⚠️ Partial invoice PDF generation failed (WhatsApp will still be attempted):", pdfErr.message);
        }
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;

        if (updatedOrder.phone) {
          try {
            const components = [
              {
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: {
                      link: partialInvoiceUrl,
                      filename: `partial_${updatedOrder._id}.pdf`,
                    },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: updatedOrder.customerName },
                  { type: "text", text: `${updatedOrder._id}` },
                  { type: "text", text: updatedOrder.purpose || "Event" },
                  { type: "text", text: `${updatedOrder.totalAmount}` },
                  { type: "text", text: `${updatedOrder.paidAmount}` },
                  { type: "text", text: `${balance}` },
                ],
              },
            ];

            const sent = await sendWhatsAppTemplate(updatedOrder.phone, "partial_payment_invoice", components);
            if (!sent) {
              const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
              const caption = `💳 *Payment Received - Bharati Sweets*\nNamaste *${updatedOrder.customerName}*! Payment received for #${shortId}.`;
              await sendWhatsAppDocument(updatedOrder.phone, partialInvoiceUrl, `partial_${updatedOrder._id}.pdf`, caption);
            }
          } catch (waErr) {
            console.error("❌ Failed to send partial invoice WhatsApp:", waErr);
          }
        }
      }

      // Also regenerate the booking receipt to reflect current balance
      try {
        await generateBookingReceipt(updatedOrder);
      } catch (pdfErr) {
        console.error("⚠️ Booking receipt regeneration failed:", pdfErr.message);
      }
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

      // Send real-time status update notification to customer via WhatsApp
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
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;
        let invoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;

        if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
          invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;
          try {
            await generateFinalInvoice(updatedOrder);
          } catch (pdfErr) {
            console.error("⚠️ Final invoice PDF generation failed on update:", pdfErr.message);
          }
        } else {
          try {
            await generatePartialInvoice(updatedOrder);
          } catch (pdfErr) {
            console.error("⚠️ Partial invoice PDF generation failed on update:", pdfErr.message);
          }
        }
        try {
          await generateBookingReceipt(updatedOrder);
        } catch (pdfErr) {
          console.error("⚠️ Booking receipt regeneration failed on update:", pdfErr.message);
        }

        if (updatedOrder.phone) {
          try {
            const components = [
              {
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: {
                      link: invoiceUrl,
                      filename: `updated_invoice_${updatedOrder._id}.pdf`,
                    },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: updatedOrder.customerName },
                  { type: "text", text: `${updatedOrder._id}` },
                  { type: "text", text: updatedOrder.purpose || "Event" },
                  { type: "text", text: `${updatedOrder.totalAmount}` },
                  { type: "text", text: `${updatedOrder.paidAmount}` },
                  { type: "text", text: `${balance}` },
                ],
              },
            ];

            const sent = await sendWhatsAppTemplate(updatedOrder.phone, "order_updated", components);
            if (!sent) {
              const shortId = updatedOrder._id.toString().slice(-6).toUpperCase();
              const caption = `📝 *Updated Order - Bharati Sweets*\nNamaste *${updatedOrder.customerName}*! Order #${shortId} has been updated.`;
              await sendWhatsAppDocument(updatedOrder.phone, invoiceUrl, `updated_invoice_${updatedOrder._id}.pdf`, caption);
            }
          } catch (waErr) {
            console.error("❌ Failed to send updated invoice WhatsApp:", waErr);
          }
        }
      } catch (err) {
        console.error("❌ Error in order update invoice/WhatsApp flow:", err);
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
