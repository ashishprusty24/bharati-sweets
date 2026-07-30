const RegularOrder = require("../models/RegularOrder");
const inventoryController = require("./inventoryController");
const { generateInvoiceUrl } = require("../utils/pdfService");
const { API_BASE_URL } = require("../common/config");

const createRegularOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { customerName, phone, items = [], payment } = payload;
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      await inventoryController.updateInventoryFromOrder(items);

      const newOrder = new RegularOrder({
        customerName,
        phone,
        items,
        totalAmount,
        payment: {
          ...payment,
          amount: payment?.amount !== undefined ? payment.amount : totalAmount,
        },
      });

      const savedOrder = await newOrder.save();

      await generateInvoiceUrl(savedOrder);
      const invoiceUrl = `${API_BASE_URL}/invoices/invoice_${savedOrder._id}.pdf`;

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
                name: "purchase_receipt_3",
                language: { code: "en_US" },
                components: [
                  {
                    type: "header",
                    parameters: [
                      {
                        type: "document",
                        document: {
                          link: invoiceUrl,
                          filename: `invoice_${savedOrder._id}.pdf`,
                        },
                      },
                    ],
                  },
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: customerName },
                      { type: "text", text: `#${savedOrder._id}` },
                    ],
                  },
                  {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [{ type: "text", text: "12345" }],
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
