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

function generatePartialInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "receipts");

      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `partial_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Title
      doc
        .fontSize(20)
        .text("Partial Payment Invoice", { align: "center" })
        .moveDown(1);

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

      // Payment details
      const balance = order.totalAmount - order.paidAmount;

      doc.moveDown(1).text(`Total Amount: ₹${order.totalAmount}`);
      doc.text(`Paid So Far: ₹${order.paidAmount}`);
      doc.text(`Balance Pending: ₹${balance}`);
      doc.text("Status: PARTIALLY PAID");

      doc.end();

      stream.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
}

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
  generateBookingReceipt,
  generateFinalInvoice,
  generatePartialInvoice,
  generateInvoiceUrl,
};

// utils/pdfService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateStyledInvoice(order, type = "final") {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

      const fileName = `${type}_${order._id}.pdf`;
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

      doc
        .fontSize(18)
        .fillColor("#000")
        .text(
          type === "booking"
            ? "BOOKING RECEIPT"
            : type === "final"
            ? "FINAL INVOICE"
            : "PARTIAL PAYMENT INVOICE",
          { align: "right" }
        );

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
        .fillColor("#000")
        .text("Bill To:", 50, 170)
        .fontSize(12)
        .fillColor("#333")
        .text(order.customerName, 50, 185)
        .text(order.phone, 50, 200)
        .text(order.address || "", 50, 215);

      // ---------------- ITEMS TABLE ----------------
      const tableTop = 250;
      const itemX = 50;
      const descX = 120;
      const qtyX = 300;
      const priceX = 360;
      const totalX = 450;

      // Header
      doc.fontSize(12).fillColor("#000");
      doc.text("Item", itemX, tableTop);
      doc.text("Description", descX, tableTop);
      doc.text("Qty", qtyX, tableTop);
      doc.text("Price", priceX, tableTop);
      doc.text("Total", totalX, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Rows
      let y = tableTop + 25;
      order.items.forEach((item, i) => {
        doc.fontSize(10).fillColor("#333");
        doc.text(i + 1, itemX, y);
        doc.text(item.name, descX, y);
        doc.text(item.quantity, qtyX, y);
        doc.text(`₹${item.price}`, priceX, y);
        doc.text(`₹${item.total}`, totalX, y);
        y += 20;
      });

      // ---------------- TOTALS ----------------
      const balance = order.totalAmount - order.paidAmount;
      doc
        .moveTo(50, y + 10)
        .lineTo(550, y + 10)
        .stroke();

      if (type === "booking") {
        doc.fontSize(12).text("Advance Paid:", 360, y + 25);
        doc.text(`₹${order.paidAmount}`, totalX, y + 25);
        doc.text("Total Amount:", 360, y + 45);
        doc.text(`₹${order.totalAmount}`, totalX, y + 45);
      } else if (type === "partial") {
        doc.fontSize(12).text("Total Amount:", 360, y + 25);
        doc.text(`₹${order.totalAmount}`, totalX, y + 25);
        doc.text("Paid So Far:", 360, y + 45);
        doc.text(`₹${order.paidAmount}`, totalX, y + 45);
        doc.text("Balance:", 360, y + 65);
        doc.text(`₹${balance}`, totalX, y + 65);
      } else if (type === "final") {
        doc.fontSize(12).text("Total Amount:", 360, y + 25);
        doc.text(`₹${order.totalAmount}`, totalX, y + 25);
        doc.text("Paid in Full:", 360, y + 45);
        doc.text(`₹${order.paidAmount}`, totalX, y + 45);
      }

      // ---------------- FOOTER ----------------
      doc
        .fontSize(10)
        .fillColor("gray")
        .text("Thank you for your business!", 50, 700, { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateStyledInvoice };
