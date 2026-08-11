"use client";

import React, { useRef } from "react";
import { Modal, Button, Grid } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { useBreakpoint } = Grid;

const InvoiceModal = ({ visible, order, onCancel }) => {
  const invoiceRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  const handleDownloadPDF = () => {
    window.print();
  };

  const packets = order.packets || 1;
  const items = order.items || [];
  const discountPerPacket = Number(order.discount || 0);

  const packetTotal = items.reduce(
    (sum, item) => sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1),
    0
  );

  const finalPacketPrice = (packetTotal - discountPerPacket).toFixed(2);
  const calculatedTotalNum = Number(order.totalAmount || (finalPacketPrice * packets));
  const calculatedTotal = calculatedTotalNum.toFixed(2);
  const totalPaidNumber = (order.payments && order.payments.length > 0)
    ? order.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : Number(order.paidAmount || order.advancePaid || order.advancePayment || 0);
  const totalPaid = totalPaidNumber.toFixed(2);
  const balance = Math.max(0, calculatedTotalNum - totalPaidNumber).toFixed(2);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      title="Invoice Preview"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 820}
      centered
      className="responsive-modal"
      styles={{ body: { padding: isMobile ? 4 : 16, maxHeight: "82vh", overflowY: "auto" } }}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF} style={{ background: "#4a151b", borderColor: "#4a151b" }}>
          Download PDF / Print
        </Button>
      ]}
    >
      <div
        ref={invoiceRef}
        style={{
          padding: isMobile ? "12px" : "24px",
          background: "#ffffff",
          color: "#1c1917",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "12px",
          lineHeight: 1.4,
          borderRadius: 16,
          border: "1px solid #f1f5f9",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/assets/logo.jpeg"
              onError={(e) => { e.target.onerror = null; e.target.src = "/assets/bharati-sweets-icon.png"; }}
              alt="Bharati Sweets Logo"
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #d97706",
              }}
            />
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#4a151b", margin: 0, lineHeight: 1.1 }}>
                Bharati Sweets
              </h1>
              <div style={{ fontSize: 11, color: "#b45309", fontStyle: "italic", marginTop: 2 }}>
                — Taste of Tradition, Made with Love —
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-block", background: "#4a151b", color: "#ffffff", padding: "5px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              INVOICE
            </div>
            <div style={{ fontSize: 11, color: "#78350f" }}>
              Invoice No: <strong>{order._id ? order._id.slice(-8) : "N/A"}</strong>
            </div>
            <div style={{ fontSize: 11, color: "#78350f", fontWeight: 700 }}>
              Date: {formatDate(order.invoiceDate || new Date())}
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "2px solid #eab308", margin: "12px 0 16px 0" }}></div>

        {/* BILL TO & ORDER DETAILS */}
        <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#fffcf8", border: "1px solid #fef3c7", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#78350f", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>
              👤 BILL TO
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", marginBottom: 2 }}>
              {order.customerName || "Customer"}
            </div>
            <div style={{ fontSize: 11, color: "#44403c" }}>{order.phone || order.customerPhone || "N/A"}</div>
            <div style={{ fontSize: 11, color: "#44403c" }}>{order.address || "N/A"}</div>
          </div>

          <div style={{ flex: 1, background: "#fffcf8", border: "1px solid #fef3c7", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#78350f", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>
              📋 ORDER DETAILS
            </div>
            <div style={{ fontSize: 11, color: "#44403c" }}>Order ID: <strong>{order._id ? order._id.slice(-8) : "N/A"}</strong></div>
            <div style={{ fontSize: 11, color: "#44403c" }}>Event: <strong>{order.purpose || "N/A"}</strong></div>
            <div style={{ fontSize: 11, color: "#44403c" }}>Delivery: <strong>{formatDate(order.deliveryDate || order.eventDate)} at {order.deliveryTime || "TBD"}</strong></div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#78350f", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>
          📦 ITEMS PER PACKET ({packets} PACKETS TOTAL)
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr style={{ background: "#4a151b", color: "#ffffff", fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>DESCRIPTION</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>QTY/PACKET</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>PRICE/PACKET</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>{item.quantity || 1}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>₹{Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>₹{(Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DELIVERY & TOTALS CARDS */}
        <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#fffcf8", border: "1px solid #fef3c7", borderRadius: 12, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#78350f", textTransform: "uppercase", marginBottom: 6 }}>
              ⏰ DELIVERY DATE & TIME
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
              {formatDate(order.deliveryDate || order.eventDate)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4a151b", marginTop: 2 }}>
              at {order.deliveryTime || "TBD"}
            </div>
          </div>

          <div style={{ flex: 1, background: "#fffcf8", border: "1px solid #fef3c7", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#57534e" }}>Packet Total</span>
              <span style={{ fontWeight: 600 }}>₹{Number(packetTotal).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#57534e" }}>Discount</span>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>- ₹{discountPerPacket.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: "1px dotted #cbd5e1", margin: "6px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#57534e" }}>Net per Packet</span>
              <span style={{ fontWeight: 600 }}>₹{finalPacketPrice}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#57534e" }}>Packets</span>
              <span style={{ fontWeight: 600 }}>{packets}</span>
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", margin: "6px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1c1917" }}>₹{Number(calculatedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#57534e" }}>Paid</span>
              <span style={{ fontWeight: 600, color: "#15803d" }}>₹{Number(totalPaid).toFixed(2)}</span>
            </div>
            {Number(balance) > 0 ? (
              <div style={{ background: "#fee2e2", borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: 800, fontSize: 15, marginTop: 8 }}>
                <span>Balance</span>
                <span>₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 12, textAlign: "right", marginTop: 4 }}>
                STATUS: PAID IN FULL
              </div>
            )}
          </div>
        </div>

        {/* SCAN & PAY + FOOTER CARD */}
        <div style={{ border: "1px solid #fef3c7", background: "#ffffff", borderRadius: 12, padding: 16, textAlign: "center" }}>
          {Number(balance) > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4a151b", marginBottom: 4 }}>
                Scan to pay balance (₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })})
              </div>
              <div style={{ color: "#d97706", fontSize: 10, marginBottom: 8 }}>— ✦ —</div>
              <div style={{ border: "1px solid #fef3c7", background: "#fffcf8", borderRadius: 10, padding: 14, maxWidth: 380, margin: "0 auto 12px auto" }}>
                {/* UPI + Paytm branding row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ border: "1.5px solid #4a151b", borderRadius: 6, padding: "4px 10px", textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#4a151b", letterSpacing: 1 }}>UPI</div>
                    <div style={{ fontSize: 8, color: "#78350f" }}>Accepted here</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-block", background: "#00BAF2", color: "#fff", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 4, letterSpacing: 0.5 }}>
                      pay<span style={{ fontWeight: 400 }}>tm</span>
                    </span>
                    <div style={{ fontSize: 9, color: "#44403c", fontWeight: 600, marginTop: 2 }}>BHARATI SWEETS<br />+91 70089 14416</div>
                  </div>
                </div>
                <img
                  src="/assets/qrcode.png"
                  alt="UPI QR Code"
                  style={{ width: 120, height: 120, objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: 8, padding: 4, background: "#fff" }}
                />
                <div style={{ fontSize: 9, color: "#78350f", fontWeight: 600, marginTop: 6 }}>Scan & Pay with any UPI App</div>
              </div>
            </>
          )}

          <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#4a151b", fontStyle: "italic", margin: "8px 0 6px 0" }}>
            Thank you for your business! ♡
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 9, color: "#78350f", padding: "0 4px" }}>
            <span style={{ textAlign: "left" }}>📍 Bharati Sweets, By Pass, Dala,<br />&nbsp;&nbsp;&nbsp;&nbsp;Bysannagar, Odisha 755019</span>
            <span style={{ textAlign: "center" }}>📞 +91 70089 14416 / +91 70080 84419</span>
            <span style={{ textAlign: "right" }}>✉️ bharatisweets@gmail.com</span>
          </div>
          <div style={{ height: 6, background: "repeating-linear-gradient(45deg, #4a151b, #4a151b 8px, #d97706 8px, #d97706 16px)", borderRadius: "0 0 10px 10px", marginTop: 10 }}></div>
        </div>

      </div>
    </Modal>
  );
};

export default InvoiceModal;
