const EventOrder = require("../models/EventOrder");
const inventoryController = require("./inventoryController");
const {
  generateBookingReceipt,
  generateFinalInvoice,
  generatePartialInvoice,
} = require("../utils/pdfService");
const { API_BASE_URL } = require("../common/config");
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

      // Seed initial receipt
      await generateBookingReceipt(savedOrder);
      const bookingReceiptUrl = `${API_BASE_URL}/receipts/booking_${savedOrder._id}.pdf`;

      try {
        const response = await fetch(
          `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378"}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: {
                name: "booking_receipt",
                language: { code: "en_US" },
                components: [
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
                      { type: "text", text: savedOrder.purpose },
                      { type: "text", text: `${savedOrder.paidAmount}` },
                      { type: "text", text: `${savedOrder.totalAmount}` },
                      {
                        type: "text",
                        text: `₹${savedOrder.totalAmount - savedOrder.paidAmount}`,
                      },
                    ],
                  },
                  {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                      {
                        type: "text",
                        text: bookingReceiptUrl,
                      },
                    ],
                  },
                ],
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`WhatsApp API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ WhatsApp message sent successfully:", data);
      } catch (whatsappError) {
        console.error("❌ Failed to send WhatsApp message:", whatsappError);
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
        await generateFinalInvoice(updatedOrder);
        const invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;

        try {
          const response = await fetch(
            `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378"}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: updatedOrder.phone,
                type: "template",
                template: {
                  name: "final_invoice",
                  language: { code: "en_US" },
                  components: [
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
                        { type: "text", text: updatedOrder.purpose },
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
                          text: invoiceUrl,
                        },
                      ],
                    },
                  ],
                },
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("WhatsApp API error for final invoice:", response.status, errData);
          } else {
            const data = await response.json();
            console.log("✅ Final Invoice WhatsApp message sent:", data);
          }
        } catch (whatsappError) {
          console.error("❌ Failed to send WhatsApp message:", whatsappError);
        }
      } else {
        await generatePartialInvoice(updatedOrder);
        const partialInvoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;

        try {
          const response = await fetch(
            `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378"}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: updatedOrder.phone,
                type: "template",
                template: {
                  name: "partial_payment_invoice",
                  language: { code: "en_US" },
                  components: [
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
                        { type: "text", text: updatedOrder.purpose },
                        { type: "text", text: `${updatedOrder.totalAmount}` },
                        { type: "text", text: `${updatedOrder.paidAmount}` },
                        { type: "text", text: `${balance}` },
                      ],
                    },
                  ],
                },
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("WhatsApp API error for partial invoice:", response.status, errData);
          } else {
            const data = await response.json();
            console.log("✅ Partial Payment WhatsApp message sent for installment:", data);
          }
        } catch (whatsappError) {
          console.error("❌ Failed to send WhatsApp partial payment:", whatsappError);
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

const updateStatus = (orderId, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await EventOrder.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true }
      );
      if (!updatedOrder) return reject({ status: 404, message: "Order not found" });
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
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

      // Regenerate appropriate invoice/receipt after update
      try {
        const timestamp = Date.now();
        let invoiceUrl = "";
        let templateName = "";

        if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
          await generateFinalInvoice(updatedOrder);
          invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf?t=${timestamp}`;
          templateName = "final_invoice";
        } else {
          await generatePartialInvoice(updatedOrder);
          invoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf?t=${timestamp}`;
          templateName = "partial_payment_invoice";
        }
        await generateBookingReceipt(updatedOrder);

        // Send WhatsApp message
        try {
          const response = await fetch(
            `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378"}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: updatedOrder.phone,
                type: "template",
                template: {
                  name: templateName,
                  language: { code: "en_US" },
                  components: [
                    {
                      type: "header",
                      parameters: [
                        {
                          type: "document",
                          document: {
                            link: invoiceUrl,
                            filename: `${templateName === "final_invoice" ? "final" : "partial"}_${updatedOrder._id}.pdf`,
                          },
                        },
                      ],
                    },
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: updatedOrder.customerName },
                        { type: "text", text: `${updatedOrder._id}` },
                        { type: "text", text: updatedOrder.purpose },
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
                          text: invoiceUrl,
                        },
                      ],
                    },
                  ],
                },
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("WhatsApp API error for updated invoice:", response.status, errData);
          } else {
            console.log("✅ Updated Invoice WhatsApp message sent successfully");
          }
        } catch (whatsappError) {
          console.error("❌ Failed to send WhatsApp message for updated invoice:", whatsappError);
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
