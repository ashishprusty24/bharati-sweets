// utils/pdfService.js
const fs = require("fs");
const path = require("path");
const pdf = require("html-pdf");

// The single, reusable HTML template for all documents
const invoiceTemplate = (order, title, status) => {
  const isFullPayment = status === "PAID IN FULL";
  const balance = (
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0)
  ).toFixed(2);
  const payments = order.payments || [];
  const totalPaid = payments
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2);

  const isPartial = status.includes("PARTIAL");
  const isFinal = status.includes("FINAL") || status.includes("PAID IN FULL");
  const isBooking = status.includes("BOOKING");

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 50px;
                color: #1f2937;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
            }
            .company-info h1 {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }
            .company-info p {
                font-size: 12px;
                color: #6b7280;
                margin: 2px 0;
            }
            .invoice-details {
                text-align: right;
            }
            .invoice-details h2 {
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .invoice-details p {
                font-size: 14px;
                margin: 2px 0;
            }
            .customer-section {
                margin-top: 30px;
            }
            .customer-section h3 {
                font-size: 16px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }
            .customer-section p {
                font-size: 14px;
                margin: 2px 0;
            }
            .table-container {
                margin-top: 30px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
            }
            .items-table th, .items-table td {
                text-align: left;
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .items-table th {
                font-size: 14px;
                background-color: #f3f4f6;
            }
            .items-table td {
                font-size: 14px;
            }
            .summary-section {
                margin-top: 30px;
                text-align: right;
            }
            .summary-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 5px;
            }
            .summary-label {
                font-weight: bold;
                font-size: 16px;
                width: 200px;
            }
            .summary-value {
                width: 150px;
                font-size: 16px;
                margin-left: 20px;
            }
            .status {
                font-size: 18px;
                font-weight: bold;
                margin-top: 20px;
            }
            .paid-status {
                color: #22c55e;
            }
            .balance-status {
                color: #ef4444;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-info">
                    <h1>Bharati Sweets</h1>
                    <p>Infront of Vyasanagar town hall, Jajpur, 755109</p>
                    <p>Phone: +91 7008084419</p>
                    <p>Email: info@bharatisweets.com</p>
                </div>
                <div class="invoice-details">
                    <h2>${title}</h2>
                    <p><strong>Invoice ID:</strong> #${order._id}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div class="customer-section">
                <h3>Bill To</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Address:</strong> ${order.address || "N/A"}</p>
                <p><strong>Purpose:</strong> ${order.purpose || "N/A"}</p>
            </div>

            <div class="table-container">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity} ${item.unit || "g"}</td>
                                <td>₹${Number(item.price).toFixed(2)}</td>
                                <td>₹${Number(item.total).toFixed(2)}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            <div class="summary-section">
                <div class="summary-row">
                    <span class="summary-label">Total Amount:</span>
                    <span class="summary-value">₹${Number(
                      order.totalAmount
                    ).toFixed(2)}</span>
                </div>
                ${
                  isFinal
                    ? `
                    <div class="summary-row">
                        <span class="summary-label">Total Paid:</span>
                        <span class="summary-value">₹${totalPaid}</span>
                    </div>
                `
                    : ""
                }
                ${
                  isPartial || isBooking
                    ? `
                    <div class="summary-row">
                        <span class="summary-label">Paid So Far:</span>
                        <span class="summary-value">₹${Number(
                          order.paidAmount
                        ).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Balance Due:</span>
                        <span class="summary-value">₹${balance}</span>
                    </div>
                `
                    : ""
                }
                <div class="status ${
                  isFullPayment ? "paid-status" : "balance-status"
                }">
                    STATUS: ${status}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Configuration for html-pdf
const pdfOptions = {
  format: "A4",
  border: {
    top: "20px",
    right: "20px",
    bottom: "20px",
    left: "20px",
  },
};

// --- REUSABLE HELPER: Encapsulates PDF creation logic ---
function createPdfFromHtml(htmlContent, filePath) {
  return new Promise((resolve, reject) => {
    pdf.create(htmlContent, pdfOptions).toFile(filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(filePath);
    });
  });
}

function generateBookingReceipt(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `booking_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const htmlContent = invoiceTemplate(
        order,
        "BOOKING RECEIPT",
        "BOOKING RECEIPT"
      );

      createPdfFromHtml(htmlContent, filePath).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function generateFinalInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `final_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const htmlContent = invoiceTemplate(
        order,
        "FINAL INVOICE",
        "PAID IN FULL"
      );

      createPdfFromHtml(htmlContent, filePath).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function generatePartialInvoice(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "receipts");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `partial_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);
      const htmlContent = invoiceTemplate(
        order,
        "PARTIAL PAYMENT",
        "PARTIALLY PAID"
      );

      createPdfFromHtml(htmlContent, filePath).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function generateInvoiceUrl(order) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const fileName = `invoice_${order._id}.pdf`;
      const filePath = path.join(dir, fileName);

      const total = Number(order.totalAmount || 0);
      const payments = order.payments || [];
      const totalPaid = payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      const status = totalPaid >= total ? "PAID IN FULL" : "BALANCE DUE";

      const htmlContent = invoiceTemplate(order, "INVOICE", status);

      createPdfFromHtml(htmlContent, filePath).then(resolve).catch(reject);
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
