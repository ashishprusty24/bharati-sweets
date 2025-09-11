const RegularOrder = require("../models/RegularOrder");
const {
  updateInventory,
  revertInventory,
  updateInventoryFromOrder,
} = require("./inventoryController");
const { sendWhatsApp } = require("../utils/whatsappService");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { generateInvoiceUrl } = require("../utils/pdfService");

const createRegularOrder = async (payload) => {
  try {
    const { customerName, phone, items, payment } = payload;
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Update stock
    await updateInventoryFromOrder(items);

    // Save order
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

    // Create readable items description
    const itemsDescription = items
      .map((item) => `${item.quantity}${item.unit || "g"} ${item.name}`)
      .join(", ");

    // Generate invoice PDF link dynamically
    // const invoiceUrl = await generateInvoiceUrl(savedOrder);

    // try {
    //   const response = await fetch(
    //     "https://graph.facebook.com/v22.0/775800332280378/messages",
    //     {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         messaging_product: "whatsapp",
    //         to: phone,
    //         type: "template",
    //         template: {
    //           name: "purchase_receipt_3",
    //           language: { code: "en_US" },
    //           components: [
    //             {
    //               type: "header",
    //               parameters: [
    //                 {
    //                   type: "document",
    //                   document: {
    //                     link: `https://bharati-sweets-backend.onrender.com/invoices/invoice_${savedOrder._id}.pdf`,
    //                     filename: `invoice_${savedOrder._id}.pdf`,
    //                   },
    //                 },
    //               ],
    //             },
    //             {
    //               type: "body",
    //               parameters: [
    //                 { type: "text", text: customerName }, // Name
    //                 { type: "text", text: `#${savedOrder._id}` }, // Order ID
    //               ],
    //             },
    //             {
    //               type: "button",
    //               sub_type: "url",
    //               index: "0",
    //               parameters: [{ type: "text", text: "12345" }],
    //             },
    //           ],
    //         },
    //       }),
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`WhatsApp API error: ${response.statusText}`);
    //   }

    //   const data = await response.json();
    //   console.log("✅ WhatsApp message sent successfully:", data);
    // } catch (whatsappError) {
    //   console.error("❌ Failed to send WhatsApp message:", whatsappError);
    //   // Don’t reject order if WhatsApp fails
    // }

    return {
      ...savedOrder.toObject(),
      // invoiceUrl: invoiceUrl,
    };
  } catch (err) {
    throw err;
  }
};

const getAllRegularOrders = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await RegularOrder.find().sort({ createdAt: -1 });
      resolve(orders);
    } catch (err) {
      reject(err);
    }
  });
};

const getRegularOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }
      resolve(order);
    } catch (err) {
      reject(err);
    }
  });
};

const updateRegularOrder = (orderId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // if (updateData.items || updateData.payment) {
      //   return reject({
      //     status: 400,
      //     message: "Items and payment cannot be modified after creation",
      //   });
      // }

      const updatedOrder = await RegularOrder.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );
      if (!updatedOrder) {
        return reject({ status: 404, message: "Order not found" });
      }

      console.log(updatedOrder);

      resolve(updatedOrder);
    } catch (err) {
      reject(err);
    }
  });
};

const deleteRegularOrder = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await RegularOrder.findById(orderId);
      if (!order) {
        return reject({ status: 404, message: "Order not found" });
      }

      await revertInventory(order.items);
      await RegularOrder.findByIdAndDelete(orderId);

      // await sendWhatsApp(
      //   order.phone,
      //   `Your order #${order._id} has been cancelled. ₹${order.payment.amount} will be refunded.`
      // );

      resolve({ message: "Order deleted successfully" });
    } catch (err) {
      console.log(err);

      reject(err);
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
