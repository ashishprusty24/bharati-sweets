const fs = require("fs");
const path = require("path");
const pdf = require("html-pdf");

let qrCodeBase64 = "";
try {
  const qrPath = path.join(process.cwd(), "public", "images", "qrcode.jpeg");
  if (fs.existsSync(qrPath)) {
    const bitmap = fs.readFileSync(qrPath);
    qrCodeBase64 = `data:image/jpeg;base64,${bitmap.toString("base64")}`;
  }
} catch (e) {
  console.log("Error loading QR code", e);
}

let logoBase64 = "";
try {
  const pathsToTry = [
    path.join(process.cwd(), "public", "images", "logo.jpeg"),
    path.join(process.cwd(), "public", "images", "bharati-sweets-icon.png"),
    path.join(__dirname, "..", "..", "Frontend", "public", "assets", "logo.jpeg"),
    path.join(__dirname, "..", "..", "Frontend", "public", "assets", "bharati-sweets-icon.png"),
    path.join(process.cwd(), "..", "Frontend", "public", "assets", "logo.jpeg"),
    path.join(process.cwd(), "..", "Frontend", "public", "assets", "bharati-sweets-icon.png"),
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      const bitmap = fs.readFileSync(p);
      const ext = p.endsWith(".png") ? "png" : "jpeg";
      logoBase64 = `data:image/${ext};base64,${bitmap.toString("base64")}`;
      break;
    }
  }
} catch (e) {
  console.log("Error loading logo image", e);
}

// Fallback Logo SVG Crest
const crestLogoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="%234a151b" stroke="%23d97706" stroke-width="2"/><circle cx="30" cy="30" r="24" fill="none" stroke="%23fef3c7" stroke-width="1" stroke-dasharray="2 2"/><text x="30" y="38" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="%23fef3c7" text-anchor="middle" font-style="italic">B</text></svg>`;

const invoiceTemplate = (order, title, status) => {
  const packets = order.packets || 1;
  const items = order.items || [];
  const discountPerPacket = Number(order.discount || 0);

  const packetTotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const finalPacketPrice = (packetTotal - discountPerPacket).toFixed(2);
  const calculatedTotal = (finalPacketPrice * packets).toFixed(2);
  const totalPaid = (order.payments || [])
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2);
  const balance = (calculatedTotal - totalPaid).toFixed(2);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const activeLogo = logoBase64 || crestLogoSvg;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 6mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1c1917;
      background-color: #ffffff;
      font-size: 11px;
      line-height: 1.35;
    }
    .wrapper {
      width: 100%;
      margin: 0 auto;
      padding: 4px;
    }
    
    /* HEADER */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .header-table td { vertical-align: middle; }
    .brand-logo-img {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #d97706;
      display: inline-block;
      vertical-align: middle;
    }
    .brand-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 23px;
      font-weight: 700;
      color: #4a151b;
      margin: 0;
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 10px;
      color: #b45309;
      font-style: italic;
      margin-top: 2px;
    }
    .doc-badge {
      display: inline-block;
      background: #4a151b;
      color: #ffffff;
      padding: 4px 16px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-text {
      font-size: 10px;
      color: #78350f;
      margin: 1px 0;
    }
    .gold-divider {
      border-bottom: 2px solid #eab308;
      margin: 8px 0 12px 0;
    }

    /* 2 COLUMNS CARDS */
    .two-col-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 0;
      margin-bottom: 12px;
    }
    .two-col-table td {
      width: 50%;
      vertical-align: top;
      background: #fffcf8;
      border: 1px solid #fef3c7;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .card-heading {
      font-size: 10px;
      font-weight: 700;
      color: #78350f;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.4px;
    }
    .card-val-bold {
      font-size: 12px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 2px;
    }
    .card-val-sub {
      font-size: 10px;
      color: #44403c;
      margin: 1px 0;
    }

    /* ITEMS TABLE */
    .table-section-title {
      font-size: 10px;
      font-weight: 700;
      color: #78350f;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .items-table th {
      background: #4a151b;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 6px 10px;
      text-align: center;
    }
    .items-table th:first-child { text-align: left; }
    .items-table th:last-child { text-align: right; }
    .items-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11px;
      color: #292524;
      text-align: center;
    }
    .items-table td:first-child { text-align: left; font-weight: 600; }
    .items-table td:last-child { text-align: right; }

    /* TOTALS & DELIVERY */
    .totals-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 0;
      margin-bottom: 12px;
    }
    .totals-table td {
      width: 50%;
      vertical-align: top;
      background: #fffcf8;
      border: 1px solid #fef3c7;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .total-row {
      display: table;
      width: 100%;
      margin-bottom: 3px;
      font-size: 10px;
    }
    .total-row-lbl { display: table-cell; text-align: left; color: #57534e; }
    .total-row-val { display: table-cell; text-align: right; color: #1c1917; font-weight: 600; }
    
    .grand-total {
      font-size: 18px;
      font-weight: 800;
      color: #1c1917;
    }
    .balance-box {
      background: #fee2e2;
      border-radius: 6px;
      padding: 6px 10px;
      color: #dc2626;
      font-weight: 800;
      font-size: 13px;
      margin-top: 6px;
    }

    /* LOWER PAY & FOOTER CARD */
    .pay-card {
      border: 1px solid #fef3c7;
      background: #ffffff;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }
    .scan-title {
      font-size: 12px;
      font-weight: 700;
      color: #4a151b;
      margin-bottom: 6px;
    }
    .upi-brands-row {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .upi-brands-row td {
      vertical-align: middle;
      padding: 4px 8px;
    }
    .upi-badge {
      display: inline-block;
      border: 1.5px solid #4a151b;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 10px;
      color: #4a151b;
      font-weight: 700;
    }
    .upi-badge-label {
      font-size: 14px;
      font-weight: 800;
      color: #4a151b;
      letter-spacing: 1px;
    }
    .upi-badge-sub {
      font-size: 8px;
      color: #78350f;
      display: block;
      margin-top: 1px;
    }
    .paytm-badge {
      display: inline-block;
      background: #00BAF2;
      color: #fff;
      font-weight: 800;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .paytm-info {
      font-size: 9px;
      color: #44403c;
      font-weight: 600;
      margin-top: 2px;
    }
    .upi-container {
      border: 1px solid #fef3c7;
      background: #fffcf8;
      border-radius: 8px;
      padding: 10px;
      max-width: 340px;
      margin: 0 auto 8px auto;
    }
    .qr-img {
      width: 110px;
      height: 110px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 3px;
      background: #ffffff;
    }
    .scan-caption {
      font-size: 9px;
      color: #78350f;
      font-weight: 600;
      margin-top: 4px;
    }
    .thank-you {
      font-family: Georgia, serif;
      font-size: 13px;
      color: #4a151b;
      font-style: italic;
      margin: 8px 0 4px 0;
    }
    .footer-info-row {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .footer-info-row td {
      font-size: 9px;
      color: #78350f;
      padding: 2px 6px;
      vertical-align: middle;
    }
    .bottom-strip {
      height: 5px;
      background: repeating-linear-gradient(45deg, #4a151b, #4a151b 8px, #d97706 8px, #d97706 16px);
      border-radius: 0 0 8px 8px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td>
        <div style="display: table;">
          <div style="display: table-cell; vertical-align: middle; padding-right: 10px;">
            <img src="${activeLogo}" class="brand-logo-img" alt="Logo" />
          </div>
          <div style="display: table-cell; vertical-align: middle;">
            <h1 class="brand-title">Bharati Sweets</h1>
            <div class="brand-tagline">— Taste of Tradition, Made with Love —</div>
          </div>
        </div>
      </td>
      <td style="text-align: right;">
        <div class="doc-badge">${title}</div>
        <div class="meta-text">Invoice No: <strong>${order._id ? order._id.toString().substring(order._id.toString().length - 8) : "N/A"}</strong></div>
        <div class="meta-text">Date: <strong>${formatDate(order.invoiceDate || new Date())}</strong></div>
      </td>
    </tr>
  </table>

  <div class="gold-divider"></div>

  <!-- BILL TO & ORDER DETAILS -->
  <table class="two-col-table" cellspacing="0" cellpadding="0">
    <tr>
      <td>
        <div class="card-heading">👤 BILL TO</div>
        <div class="card-val-bold">${order.customerName || "Customer"}</div>
        <div class="card-val-sub">${order.phone || "N/A"}</div>
        <div class="card-val-sub">${order.address || "N/A"}</div>
      </td>
      <td>
        <div class="card-heading">📋 ORDER DETAILS</div>
        <div class="card-val-sub">Order ID: <strong>${order._id ? order._id.toString().substring(order._id.toString().length - 8) : "N/A"}</strong></div>
        <div class="card-val-sub">Event: <strong>${order.purpose || "N/A"}</strong></div>
        <div class="card-val-sub">Delivery: <strong>${formatDate(order.deliveryDate)} at ${order.deliveryTime || "TBD"}</strong></div>
      </td>
    </tr>
  </table>

  <!-- ITEMS TABLE -->
  <div class="table-section-title">📦 ITEMS PER PACKET (${packets} PACKETS TOTAL)</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>DESCRIPTION</th>
        <th>QTY/PACKET</th>
        <th>PRICE/PACKET</th>
        <th>TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity || 1}</td>
          <td>₹${Number(item.price || 0).toFixed(2)}</td>
          <td>₹${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <!-- DELIVERY & TOTALS CARDS -->
  <table class="totals-table" cellspacing="0" cellpadding="0">
    <tr>
      <td>
        <div class="card-heading">⏰ DELIVERY DATE & TIME</div>
        <div style="font-size: 14px; font-weight: 700; color: #1c1917; margin-top: 6px;">
          ${formatDate(order.deliveryDate)}
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #4a151b; margin-top: 2px;">
          at ${order.deliveryTime || "TBD"}
        </div>
      </td>
      <td>
        <div class="total-row">
          <span class="total-row-lbl">Packet Total</span>
          <span class="total-row-val">₹${Number(packetTotal).toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-row-lbl">Discount</span>
          <span class="total-row-val" style="color: #dc2626;">- ₹${discountPerPacket.toFixed(2)}</span>
        </div>
        <div style="border-top: 1px dotted #cbd5e1; margin: 4px 0;"></div>
        <div class="total-row">
          <span class="total-row-lbl">Net per Packet</span>
          <span class="total-row-val">₹${finalPacketPrice}</span>
        </div>
        <div class="total-row">
          <span class="total-row-lbl">Packets</span>
          <span class="total-row-val">${packets}</span>
        </div>
        <div style="border-top: 1px solid #e2e8f0; margin: 4px 0;"></div>
        <div class="total-row" style="margin-top: 4px;">
          <span style="display: table-cell; font-size: 13px; font-weight: 700; text-align: left;">Total</span>
          <span style="display: table-cell; font-size: 18px; font-weight: 800; text-align: right; color: #1c1917;">₹${Number(calculatedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="total-row">
          <span class="total-row-lbl">Paid</span>
          <span class="total-row-val">₹${Number(totalPaid).toFixed(2)}</span>
        </div>
        ${
          Number(balance) > 0
            ? `
          <div class="balance-box">
            <div class="total-row" style="margin: 0;">
              <span style="display: table-cell; text-align: left;">Balance</span>
              <span style="display: table-cell; text-align: right;">₹${Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          `
            : `
          <div style="color: #16a34a; font-weight: 800; font-size: 11px; text-align: right; margin-top: 4px;">
            STATUS: PAID IN FULL
          </div>
          `
        }
      </td>
    </tr>
  </table>

  <!-- PAY & FOOTER CARD -->
  <div class="pay-card">
    ${
      Number(balance) > 0 && qrCodeBase64
        ? `
      <div class="scan-title">Scan to pay balance (₹${Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })})</div>
      <div style="color: #d97706; font-size: 9px; margin-bottom: 6px;">— ✦ —</div>
      <div class="upi-container">
        <table class="upi-brands-row">
          <tr>
            <td style="text-align: left; width: 50%;">
              <div class="upi-badge">
                <span class="upi-badge-label">UPI</span>
                <span class="upi-badge-sub">Accepted here</span>
              </div>
            </td>
            <td style="text-align: right; width: 50%;">
              <span class="paytm-badge">pay<span style="font-weight:400;">tm</span></span>
              <div class="paytm-info">BHARATI SWEETS<br/>+91 70089 14416</div>
            </td>
          </tr>
        </table>
        <img src="${qrCodeBase64}" class="qr-img" alt="QR Code" />
        <div class="scan-caption">Scan & Pay with any UPI App</div>
      </div>
      `
        : ""
    }
    <div class="thank-you">Thank you for your business! ♡</div>
    <table class="footer-info-row">
      <tr>
        <td style="text-align: left;">📍 Bharati Sweets, By Pass, Dala,<br/>&nbsp;&nbsp;&nbsp;&nbsp;Bysannagar, Odisha 755019</td>
        <td style="text-align: center;">📞 +91 70089 14416</td>
        <td style="text-align: right;">✉️ bharatisweets@gmail.com</td>
      </tr>
    </table>
    <div class="bottom-strip"></div>
  </div>

</div>
</body>
</html>
`;
};

// Configuration for html-pdf (A4 portrait)
const pdfOptions = {
  format: "A4",
  orientation: "portrait",
  border: {
    top: "6mm",
    right: "6mm",
    bottom: "6mm",
    left: "6mm",
  },
};

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
        "INVOICE",
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
        "PARTIAL INVOICE",
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
