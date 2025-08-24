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
    const invoiceUrl = await generateInvoiceUrl(savedOrder);

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
              name: "purchase_receipt_3",
              language: { code: "en_US" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "document",
                      document: {
                        link: `https://bharati-sweets-backend.onrender.com/invoices/invoice_${savedOrder._id}.pdf`,
                        filename: `invoice_${savedOrder._id}.pdf`,
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: customerName }, // Name
                    { type: "text", text: `#${savedOrder._id}` }, // Order ID
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
      // Don’t reject order if WhatsApp fails
    }

    return {
      ...savedOrder.toObject(),
      invoiceUrl: invoiceUrl,
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
      if (updateData.items || updateData.payment) {
        return reject({
          status: 400,
          message: "Items and payment cannot be modified after creation",
        });
      }

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

const generateInvoiceUrl = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "invoices");

      // Ensure invoices folder exists
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `invoice_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---------------- HEADER ----------------
      doc
        .fontSize(20)
        .fillColor("#333")
        .text("Bharati Sweets", 50, 50)
        .fontSize(10)
        .fillColor("gray")
        .text("123 Sweet Street, Delhi, India", 50, 75)
        .text("Phone: +91 9876543210", 50, 90)
        .text("Email: info@bharatisweets.com", 50, 105);

      doc.moveDown(2);

      // Invoice title
      doc.fontSize(18).fillColor("#000").text("INVOICE", { align: "right" });

      // ---------------- CUSTOMER INFO ----------------
      doc
        .moveDown()
        .fontSize(12)
        .fillColor("#000")
        .text(`Invoice ID: ${order._id}`, { align: "right" })
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Bill To:`, 50, 170)
        .fontSize(12)
        .fillColor("#333")
        .text(`${order.customerName}`, 50, 185)
        .text(`${order.phone}`, 50, 200);

      // ---------------- ITEMS TABLE ----------------
      const tableTop = 240;
      const itemCodeX = 50;
      const descriptionX = 120;
      const qtyX = 300;
      const priceX = 360;
      const totalX = 450;

      // Table Header
      doc.fontSize(12).fillColor("#000");
      doc.text("Item", itemCodeX, tableTop);
      doc.text("Description", descriptionX, tableTop);
      doc.text("Qty", qtyX, tableTop);
      doc.text("Price", priceX, tableTop);
      doc.text("Total", totalX, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Rows
      let y = tableTop + 25;
      order.items.forEach((item, i) => {
        doc.fontSize(10).fillColor("#333");
        doc.text(i + 1, itemCodeX, y);
        doc.text(item.name, descriptionX, y);
        doc.text(item.quantity, qtyX, y);
        doc.text(`₹${item.price}`, priceX, y);
        doc.text(`₹${item.total}`, totalX, y);
        y += 20;
      });

      // ---------------- TOTAL ----------------
      doc
        .moveTo(50, y + 10)
        .lineTo(550, y + 10)
        .stroke();
      doc.fontSize(12).fillColor("#000");
      doc.text("Grand Total:", 360, y + 25);
      doc.fontSize(12).text(`₹${order.payment.amount}`, totalX, y + 25);

      // ---------------- FOOTER ----------------
      doc
        .fontSize(10)
        .fillColor("gray")
        .text("Thank you for your purchase!", 50, 700, { align: "center" })
        .text("Visit us again at Bharati Sweets!", 50, 715, {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => {
        const invoiceUrl = `/invoices/${fileName}`;
        resolve(invoiceUrl);
      });

      stream.on("error", reject);
    } catch (err) {
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
