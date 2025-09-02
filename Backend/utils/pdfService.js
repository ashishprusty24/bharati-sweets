// utils/pdfService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// --- Helper function to add a logo and title ---
function addHeader(doc, title) {
  // Company Logo (a simple box to represent a logo)
  doc.rect(50, 50, 20, 20).fill("#3b82f6");
  doc.fontSize(18).fillColor("#000").text("Bharati Sweets", 75, 55);

  // Invoice Title
  doc
    .fontSize(20)
    .fillColor("#1f2937")
    .text(title, 350, 55, { align: "right" });

  doc.moveDown(2);
}

// --- Helper function to add an item table ---
function addTable(doc, order, yPosition) {
  const tableTop = yPosition;
  const itemX = 50;
  const qtyX = 250;
  const priceX = 350;
  const totalX = 450;

  // Table Header
  doc.fontSize(12).fillColor("#000").font("Helvetica-Bold");
  doc.text("Item", itemX, tableTop);
  doc.text("Quantity", qtyX, tableTop);
  doc.text("Price", priceX, tableTop);
  doc.text("Amount", totalX, tableTop);

  doc.moveDown(0.5);
  doc
    .strokeColor("#d1d5db")
    .moveTo(itemX, tableTop + 20)
    .lineTo(550, tableTop + 20)
    .stroke();

  // Table Rows
  let y = tableTop + 30;
  doc.fontSize(10).font("Helvetica");
  order.items.forEach((item) => {
    doc.text(item.name, itemX, y);
    doc.text(`${item.quantity} ${item.unit || "g"}`, qtyX, y);
    doc.text(`₹${item.price.toFixed(2)}`, priceX, y);
    doc.text(`₹${item.total.toFixed(2)}`, totalX, y);
    y += 20;
  });

  doc.moveDown(1);
  doc.strokeColor("#d1d5db").moveTo(itemX, y).lineTo(550, y).stroke();

  return y; // Return the current Y position for subsequent sections
}

function generateBookingReceipt(order) {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `booking_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      addHeader(doc, "BOOKING RECEIPT");

      // Customer Details
      doc.fontSize(12).font("Helvetica-Bold").text("Customer Details", 50, 110);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${order.customerName}`, 50, 130);
      doc.text(`Phone: ${order.phone}`, 50, 145);
      doc.text(
        `Delivery: ${new Date(order.deliveryDate).toDateString()}`,
        50,
        160
      );
      doc.text(`Purpose: ${order.purpose}`, 50, 175);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Payment Summary", 350, 110, { align: "right" });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Order ID: ${order._id}`, 350, 130, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 145, {
        align: "right",
      });
      doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 350, 160, {
        align: "right",
      });
      doc.text(`Advance Paid: ₹${order.paidAmount.toFixed(2)}`, 350, 175, {
        align: "right",
      });

      const balance = order.totalAmount - order.paidAmount;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(balance > 0 ? "#ef4444" : "#22c55e")
        .text(`Balance: ₹${balance.toFixed(2)}`, 350, 195, { align: "right" });

      doc.moveDown(1);

      const tableY = 220;
      addTable(doc, order, tableY);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
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
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      addHeader(doc, "FINAL INVOICE");

      // Customer Details
      doc.fontSize(12).font("Helvetica-Bold").text("Customer Details", 50, 110);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${order.customerName}`, 50, 130);
      doc.text(`Phone: ${order.phone}`, 50, 145);
      doc.text(
        `Delivery: ${new Date(order.deliveryDate).toDateString()}`,
        50,
        160
      );
      doc.text(`Purpose: ${order.purpose}`, 50, 175);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Invoice Details", 350, 110, { align: "right" });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Invoice ID: ${order._id}`, 350, 130, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 145, {
        align: "right",
      });
      doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 350, 160, {
        align: "right",
      });

      const tableY = 220;
      const finalY = addTable(doc, order, tableY);

      // Totals
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total Paid:", 350, finalY + 20, { align: "right" });
      doc.text(`₹${order.paidAmount.toFixed(2)}`, 450, finalY + 20, {
        align: "right",
      });

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#22c55e");
      doc.text("STATUS: PAID IN FULL", 50, finalY + 50);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
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
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      addHeader(doc, "PARTIAL PAYMENT INVOICE");

      // Customer Details
      doc.fontSize(12).font("Helvetica-Bold").text("Customer Details", 50, 110);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${order.customerName}`, 50, 130);
      doc.text(`Phone: ${order.phone}`, 50, 145);
      doc.text(
        `Delivery: ${new Date(order.deliveryDate).toDateString()}`,
        50,
        160
      );
      doc.text(`Purpose: ${order.purpose}`, 50, 175);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Invoice Details", 350, 110, { align: "right" });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Invoice ID: ${order._id}`, 350, 130, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 145, {
        align: "right",
      });
      doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 350, 160, {
        align: "right",
      });

      const tableY = 220;
      const finalY = addTable(doc, order, tableY);

      // Totals
      const balance = order.totalAmount - order.paidAmount;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total Paid:", 350, finalY + 20, { align: "right" });
      doc.text(`₹${order.paidAmount.toFixed(2)}`, 450, finalY + 20, {
        align: "right",
      });

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#ef4444");
      doc.text("BALANCE DUE:", 350, finalY + 40, { align: "right" });
      doc.text(`₹${balance.toFixed(2)}`, 450, finalY + 40, { align: "right" });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

function generateInvoiceUrl(order) {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
      }

      const fileName = `invoice_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      addHeader(doc, "INVOICE");

      // Customer Info
      doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", 50, 110);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Customer: ${order.customerName}`, 50, 130);
      doc.text(`Phone: ${order.phone}`, 50, 145);
      doc.text(`Address: ${order.address}`, 50, 160);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Invoice Details", 350, 110, { align: "right" });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Invoice ID: ${order._id}`, 350, 130, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 145, {
        align: "right",
      });

      const tableY = 220;
      const finalY = addTable(doc, order, tableY);

      // Totals
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total Paid:", 350, finalY + 20, { align: "right" });
      doc.text(`₹${totalPaid.toFixed(2)}`, 450, finalY + 20, {
        align: "right",
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
}

module.exports = {
  generateBookingReceipt,
  generateFinalInvoice,
  generatePartialInvoice,
  generateInvoiceUrl,
};
