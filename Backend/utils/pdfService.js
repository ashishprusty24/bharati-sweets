// utils/pdfService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// --- REUSABLE HELPER: Adds consistent header & customer info ---
function addHeaderAndCustomerInfo(doc, order, title) {
  // Logo placeholder
  doc.rect(50, 50, 20, 20).fill("#3b82f6");
  doc.fillColor("#000").fontSize(18).text("Bharati Sweets", 80, 55);

  // Company info
  doc
    .fontSize(10)
    .fillColor("gray")
    .text("Infront of vyasanagar town hall, Jajpur", 755109)
    .text("Phone: +91 7008084419", 80, 90)
    .text("Email: info@bharatisweets.com", 80, 105);

  // Title & invoice ID
  doc
    .fontSize(20)
    .fillColor("#1f2937")
    .text(title, 400, 55, { align: "right" });
  doc
    .fontSize(10)
    .fillColor("#000")
    .text(`Invoice ID: #${order._id}`, 400, 80, { align: "right" })
    .text(`Date: ${new Date().toLocaleDateString()}`, 400, 95, {
      align: "right",
    });

  // Customer Info
  doc.fontSize(12).fillColor("#000").text("Bill To:", 50, 140);
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Name: ${order.customerName}`, 50, 160)
    .text(`Phone: ${order.phone}`, 50, 175)
    .text(`Address: ${order.address}`, 50, 190);
}

// --- REUSABLE HELPER: Adds items table ---
function addTable(doc, order, startY) {
  const itemX = 50;
  const qtyX = 250;
  const priceX = 350;
  const totalX = 450;

  // Table header
  doc.fontSize(12).fillColor("#000").text("Item", itemX, startY);
  doc.text("Quantity", qtyX, startY);
  doc.text("Price", priceX, startY);
  doc.text("Amount", totalX, startY);

  doc
    .strokeColor("#d1d5db")
    .moveTo(itemX, startY + 15)
    .lineTo(550, startY + 15)
    .stroke();

  // Table rows
  let y = startY + 25;
  order.items.forEach((item) => {
    const qty = `${item.quantity} ${item.unit || "g"}`;
    const price = Number(item.price || 0).toFixed(2);
    const total = Number(item.total || 0).toFixed(2);

    doc.fontSize(10).fillColor("#333");
    doc.text(item.name, itemX, y);
    doc.text(qty, qtyX, y);
    doc.text(`₹${price}`, priceX, y);
    doc.text(`₹${total}`, totalX, y);

    y += 20;
  });

  doc.strokeColor("#d1d5db").moveTo(itemX, y).lineTo(550, y).stroke();

  return y + 10; // return bottom position
}

// ------------------ BOOKING RECEIPT ------------------
function generateBookingReceipt(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `booking_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      addHeaderAndCustomerInfo(doc, order, "BOOKING RECEIPT");
      const finalY = addTable(doc, order, 230);

      const total = Number(order.totalAmount || 0);
      const paid = Number(order.paidAmount || 0);
      const balance = total - paid;

      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Payment Details", 50, finalY + 20);
      doc
        .fontSize(10)
        .text(`Total Amount: ₹${total.toFixed(2)}`, 50, finalY + 40);
      doc.text(`Advance Paid: ₹${paid.toFixed(2)}`, 50, finalY + 55);
      doc
        .fillColor(balance > 0 ? "#ef4444" : "#22c55e")
        .fontSize(12)
        .text(`Balance: ₹${balance.toFixed(2)}`, 50, finalY + 75);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
      doc.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ------------------ FINAL INVOICE ------------------
function generateFinalInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `final_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      addHeaderAndCustomerInfo(doc, order, "FINAL INVOICE");
      const finalY = addTable(doc, order, 230);

      const total = Number(order.totalAmount || 0);
      const paid = Number(order.paidAmount || 0);

      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Summary", 50, finalY + 20);
      doc
        .fontSize(10)
        .text(`Total Amount: ₹${total.toFixed(2)}`, 50, finalY + 40);
      doc.text(`Total Paid: ₹${paid.toFixed(2)}`, 50, finalY + 55);
      doc
        .fillColor("#22c55e")
        .fontSize(14)
        .text("STATUS: PAID IN FULL", 50, finalY + 80);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
      doc.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ------------------ PARTIAL INVOICE ------------------
function generatePartialInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `partial_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      addHeaderAndCustomerInfo(doc, order, "PARTIAL PAYMENT");
      const finalY = addTable(doc, order, 230);

      const total = Number(order.totalAmount || 0);
      const paid = Number(order.paidAmount || 0);
      const balance = total - paid;

      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Summary", 50, finalY + 20);
      doc
        .fontSize(10)
        .text(`Total Amount: ₹${total.toFixed(2)}`, 50, finalY + 40);
      doc.text(`Paid So Far: ₹${paid.toFixed(2)}`, 50, finalY + 55);
      doc
        .fillColor("#ef4444")
        .fontSize(12)
        .text(`BALANCE PENDING: ₹${balance.toFixed(2)}`, 50, finalY + 75);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
      doc.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ------------------ GENERIC INVOICE ------------------
function generateInvoiceUrl(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "invoices"); // unified with others
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `invoice_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      addHeaderAndCustomerInfo(doc, order, "INVOICE");
      const finalY = addTable(doc, order, 230);

      const payments = order.payments || [];
      const total = Number(order.totalAmount || 0);
      const totalPaid = payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Summary", 50, finalY + 20);
      doc
        .fontSize(10)
        .text(`Total Amount: ₹${total.toFixed(2)}`, 50, finalY + 40);
      doc.text(`Total Paid: ₹${totalPaid.toFixed(2)}`, 50, finalY + 55);

      doc.end();

      stream.on("finish", () => resolve(`/receipts/${fileName}`));
      stream.on("error", reject);
      doc.on("error", reject);
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
