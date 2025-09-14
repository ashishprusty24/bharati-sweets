const fs = require("fs");
const path = require("path");
const pdf = require("html-pdf");

// The single, reusable HTML template for all documents
const invoiceTemplate = (order, title, status) => {
  const packets = order.packets || 1;
  const items = order.items || [];
  const discountPerPacket = Number(order.discount || 0);

  const packetTotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const finalPacketPrice = (packetTotal - discountPerPacket).toFixed(2);

  const calculatedTotal = (finalPacketPrice * packets).toFixed(2);

  const totalPaid = (order.payments || [])
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2);

  const balance = (calculatedTotal - totalPaid).toFixed(2);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Logic to split the items array for a two-column layout
  const twoColumns = items.length > 13;
  let firstColumnItems = [];
  let secondColumnItems = [];
  if (twoColumns) {
    const splitIndex = Math.ceil(items.length / 2);
    firstColumnItems = items.slice(0, splitIndex);
    secondColumnItems = items.slice(splitIndex);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 50px; color: #1f2937; background-color: white; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: table; width: 100%; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
    .header > div { display: table-cell; vertical-align: bottom; }
    .header-left { width: 50%; }
    .header-right { width: 50%; text-align: right; }
    h2 { margin: 0; color: #333; font-size: 24px; }
    p { font-size: 13px; color: #555; margin: 0; }
    .divider { border-top: 1px solid #eee; margin: 20px 0; }
    .details-table { width: 100%; margin-bottom: 20px; }
    .details-table td { vertical-align: top; }
    .details-table td:first-child { width: 50%; }
    .details-table td:last-child { width: 50%; text-align: right; }

    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th, .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: center; }
    .items-table th:first-child, .items-table td:first-child { text-align: left; }

    /* ✅ Two-column layout fixes */
    .two-column-items-table {
      width: 100%;
      border-collapse: separate !important;
      border-spacing: 20px 0; /* spacing between the two columns */
    }
    .two-column-items-table td {
      width: 50%;
      vertical-align: top;
      padding: 10px; /* padding inside each column */
    }

    .summary-cards-table { width: 100%; margin-top: 24px; }
    .summary-cards-table td { padding: 0 8px; vertical-align: top; }
    .delivery-card, .total-card { padding: 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .delivery-card { background: linear-gradient(135deg, #e6f7ff, #f0f5ff); text-align: center; }
    .total-card { background: #fffbe6; text-align: right; }
    .card-title { font-weight: bold; font-size: 18px; display: block; margin-bottom: 6px; }
    .card-text { font-size: 16px; color: #555; }
    .total-card h3 { margin: 10px 0 5px 0; color: #141414; }
    .paid-text { display: block; margin-bottom: 4px; }
    .balance-text { font-weight: bold; color: #d9363e; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #555; }
    .footer .address { font-size: 12px; color: #777; margin-top: 10px; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="header-left">
      <h2>Bharati Sweets</h2>
      <p>GST No: 21BQIPP9883R1ZQ</p>
    </div>
    <div class="header-right">
      <p>Invoice No: <span>#${order._id}</span></p>
      <p>Date: <span>${formatDate(order.invoiceDate || new Date())}</span></p>
    </div>
  </div>

 

  <table class="details-table" cellspacing="0" cellpadding="0">
    <tr>
      <td>
        <div class="customer-details">
          <h4>Bill To:</h4>
          <p><strong>${order.customerName}</strong></p>
          <p>${order.phone}</p>
          <p>${order.address || "N/A"}</p>
        </div>
      </td>
      <td>
        <div class="order-details">
          <h4>Order Details:</h4>
          <p>Order ID: ${order.orderId || order._id}</p>
          <p>Event: ${order.purpose || "N/A"}</p>
          <p>Delivery: ${formatDate(order.deliveryDate)} at ${
    order.deliveryTime || ""
  }</p>
        </div>
      </td>
    </tr>
  </table>

  <h4>Items per Packet (${packets} Packets total)</h4>
  <div class="table-container">
    ${
      twoColumns
        ? `
      <table class="two-column-items-table">
        <tr>
          <td>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty/Packet</th>
                  <th>Price/Packet</th>
                </tr>
              </thead>
              <tbody>
                ${firstColumnItems
                  .map(
                    (item, index) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    ${
                      index === 0
                        ? `<td rowspan="${firstColumnItems.length}" style="text-align: center;">₹${finalPacketPrice}</td>`
                        : ""
                    }
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </td>
          <td>
            <table class="items-table second-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty/Packet</th>
                  <th>Price/Packet</th>
                </tr>
              </thead>
              <tbody>
                ${secondColumnItems
                  .map(
                    (item, index) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    ${
                      index === 0
                        ? `<td rowspan="${secondColumnItems.length}" style="text-align: center;">₹${finalPacketPrice}</td>`
                        : ""
                    }
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    `
        : `
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty/Packet</th>
            <th>Price/Packet</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item, index) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              ${
                index === 0
                  ? `<td rowspan="${items.length}" style="text-align: center;">₹${finalPacketPrice}</td>`
                  : ""
              }
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
    }
  </div>

 

<table class="summary-cards-table" cellspacing="0" cellpadding="0">
  <tr>
    <td>
      ${
        status === "BOOKING RECEIPT"
          ? `<div class="delivery-card">
              <span class="card-title">Delivery Date & Time</span>
              <span class="card-text">${formatDate(order.deliveryDate)} at ${
              order.deliveryTime || ""
            }</span>
             </div>`
          : ``
      }
    </td>
    <td>
      <div class="total-card">
        ${
          status === "PAID IN FULL"
            ? `
            <h3>Total: ₹${calculatedTotal}</h3>
            <h5>Amount Paid: ₹${totalPaid}</h5>
            <p style="color: green; font-weight: bold;">Status: Paid in Full</p>
            `
            : status === "PARTIALLY PAID"
            ? `<p style="color: orange; font-weight: bold;">Status: Partially Paid</p>
            <h3>Total: ₹${calculatedTotal}</h3>
               <p>Paid So Far: ₹${totalPaid}</p>
               <p>Balance: ₹${balance}</p>`
            : status === "BOOKING RECEIPT"
            ? `<p>Price per Packet: <b>₹${finalPacketPrice}</b></p>
               <p>Total for ${packets} Packets: <b>₹${calculatedTotal}</b></p>
               <h3>Total: ₹${calculatedTotal}</h3>
               <p class="paid-text">Paid: ₹${totalPaid}</p>
               <p class="balance-text">Balance: ₹${balance}</p>`
            : ``
        }
      </div>
    </td>
  </tr>
</table>

  <div class="divider"></div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p class="address">Bharati Sweets • Phone: +91 70080 84419 • Address: By-Pass, Dala, Byasanagar, Odisha 755019</p>
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
