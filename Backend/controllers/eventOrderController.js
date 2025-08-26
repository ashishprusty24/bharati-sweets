const EventOrder = require("../models/EventOrder");
const {
  updateInventoryFromOrder,
  revertInventory,
} = require("./inventoryController");
const { sendWhatsApp } = require("../utils/whatsappService");
const {
  generateBookingReceipt,
  generateFinalInvoice,
} = require("../utils/pdfService");

const createEventOrder = (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        customerName,
        phone,
        purpose,
        address,
        deliveryDate,
        deliveryTime,
        items,
        payments,
      } = payload;

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      const newOrder = new EventOrder({
        customerName,
        phone,
        purpose,
        address,
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        items,
        payments,
        totalAmount,
        paidAmount,
      });

      const savedOrder = await newOrder.save();
      await updateInventoryFromOrder(items);

      await generateBookingReceipt(savedOrder);
      const bookingReceiptUrl = `https://bharati-sweets-backend.onrender.com/receipts/booking_${savedOrder._id}.pdf`;

      try {
        const response = await fetch(
          "https://graph.facebook.com/v22.0/775800332280378/messages",
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
                          link: `https://bharati-sweets-backend.onrender.com/receipts/booking_${savedOrder._id}.pdf`,
                          filename: `booking_${savedOrder._id}.pdf`,
                        },
                      },
                    ],
                  },
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: "{{customer_name}}" },
                      { type: "text", text: "#{{order_id}}" },
                      { type: "text", text: "{{purpose}}" },
                      { type: "text", text: "₹{{advance}}" },
                      { type: "text", text: "₹{{total_amount}}" },
                      { type: "text", text: "₹{{balance}}" },
                    ],
                  },
                  {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                      {
                        type: "text",
                        text: `https://bharati-sweets-backend.onrender.com/receipts/booking_${savedOrder._id}.pdf`,
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
      log;
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
        // ✅ Generate final invoice PDF
        const invoicePath = await generateFinalInvoice(updatedOrder);
        const invoiceUrl = `https://bharati-sweets-backend.onrender.com/invoices/final_${updatedOrder._id}.pdf`;

        // ✅ Send WhatsApp Final Invoice template
        try {
          const response = await fetch(
            "https://graph.facebook.com/v22.0/775800332280378/messages",
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
                            filename: `final_invoice_${updatedOrder._id}.pdf`,
                          },
                        },
                      ],
                    },
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: updatedOrder.customerName },
                        { type: "text", text: `#${updatedOrder._id}` },
                        { type: "text", text: updatedOrder.purpose },
                        { type: "text", text: `₹${updatedOrder.totalAmount}` },
                        { type: "text", text: `₹${updatedOrder.paidAmount}` },
                        { type: "text", text: "Paid in Full ✅" },
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
        const balance = updatedOrder.totalAmount - updatedOrder.paidAmount;

        try {
          const response = await fetch(
            "https://graph.facebook.com/v22.0/775800332280378/messages",
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
                      type: "body",
                      parameters: [
                        { type: "text", text: updatedOrder.customerName },
                        { type: "text", text: `#${updatedOrder._id}` },
                        { type: "text", text: updatedOrder.purpose },
                        { type: "text", text: `₹${updatedOrder.totalAmount}` },
                        { type: "text", text: `₹${updatedOrder.paidAmount}` },
                        { type: "text", text: `₹${balance}` },
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
          console.error(
            "❌ Failed to send WhatsApp partial payment:",
            whatsappError
          );
        }
      }

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
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
      }

      if (status === "delivered") {
        await sendWhatsApp(
          updatedOrder.phone,
          "Your order has been delivered! Thank you for your business."
        );
      }
      resolve(updatedOrder);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const getEventOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await EventOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }
      resolve(order);
    } catch (err) {
      reject({ status: 500, message: err.message });
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

const updateEventOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedOrder = await EventOrder.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
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
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }

      await revertInventory(order.items);
      await EventOrder.findByIdAndDelete(orderId);

      let message = `Your event order #${order._id} has been cancelled.`;
      if (order.paidAmount > 0) {
        message += ` ₹${order.paidAmount} will be refunded.`;
      }
      await sendWhatsApp(order.phone, message);

      resolve({ message: "Event order deleted successfully" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

function generateBookingReceiptUrl(order) {
  return `https://api.bharatisweets.com/receipts/event/${order._id}`;
}

module.exports = {
  createEventOrder,
  getAllEventOrders,
  getEventOrderById,
  addPayment,
  updateStatus,
  updateEventOrder,
  deleteEventOrder,
};
