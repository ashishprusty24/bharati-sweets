// utils/pdfService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateBookingReceipt(order) {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "receipts");

      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `booking_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Title
      doc.fontSize(20).text("Booking Receipt", { align: "center" }).moveDown(1);

      // Customer details
      doc.fontSize(12).text(`Customer: ${order.customerName}`);
      doc.text(`Phone: ${order.phone}`);
      doc.text(`Purpose: ${order.purpose}`);
      doc.text(`Address: ${order.address}`);
      doc.text(
        `Delivery: ${order.deliveryDate.toDateString()} at ${
          order.deliveryTime
        }`
      );
      doc.moveDown(1);

      // Items
      doc.text("Items:");
      order.items.forEach((item) => {
        doc.text(
          `- ${item.quantity}${item.unit || "g"} ${item.name} : ₹${item.total}`
        );
      });

      doc.moveDown(1).text(`Advance Paid: ₹${order.paidAmount}`);
      doc.text(`Total Amount: ₹${order.totalAmount}`);
      doc.text(`Balance: ₹${order.totalAmount - order.paidAmount}`);

      doc.end();

      stream.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
}

function generateFinalInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "receipts");

      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `final_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Title
      doc.fontSize(20).text("Final Invoice", { align: "center" }).moveDown(1);

      // Customer details
      doc.fontSize(12).text(`Customer: ${order.customerName}`);
      doc.text(`Phone: ${order.phone}`);
      doc.text(`Purpose: ${order.purpose}`);
      doc.text(`Address: ${order.address}`);
      doc.text(
        `Delivery: ${order.deliveryDate.toDateString()} at ${
          order.deliveryTime
        }`
      );
      doc.moveDown(1);

      // Items
      doc.text("Items:");
      order.items.forEach((item) => {
        doc.text(
          `- ${item.quantity}${item.unit || "g"} ${item.name} : ₹${item.total}`
        );
      });

      doc.moveDown(1).text(`Total Paid: ₹${order.paidAmount}`);
      doc.text(`Total Amount: ₹${order.totalAmount}`);
      doc.text("Status: PAID IN FULL");

      doc.end();

      stream.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateBookingReceipt, generateFinalInvoice };
