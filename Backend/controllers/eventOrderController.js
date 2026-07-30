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
        deliveryDate: new Date(deliveryDate), deliveryTime,
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

      order.payments.push(paymentData);
      order.paidAmount += paymentData.amount;
      const updatedOrder = await order.save();

      if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
        await generateFinalInvoice(updatedOrder);
        const invoiceUrl = `${API_BASE_URL}/receipts/final_${updatedOrder._id}.pdf`;

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
            throw new Error(`WhatsApp API error: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("✅ Final Invoice WhatsApp message sent:", data);
        } catch (whatsappError) {
          console.error("❌ Failed to send WhatsApp message:", whatsappError);
        }
      } else {
        await generatePartialInvoice(updatedOrder);
        const partialInvoiceUrl = `${API_BASE_URL}/receipts/partial_${updatedOrder._id}.pdf`;
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
            throw new Error(`WhatsApp API error: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("✅ Partial Payment WhatsApp message sent:", data);
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
      const updatedOrder = await EventOrder.findByIdAndUpdate(orderId, updateData, {
        new: true,
        runValidators: true,
      });
      if (!updatedOrder) return reject({ status: 404, message: "Order not found" });

      // Regenerate appropriate invoice/receipt after update
      if (updatedOrder.paidAmount >= updatedOrder.totalAmount) {
        await generateFinalInvoice(updatedOrder);
      } else {
        await generatePartialInvoice(updatedOrder);
      }
      await generateBookingReceipt(updatedOrder);

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
