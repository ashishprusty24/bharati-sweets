/**
 * Quick test: Send partial_payment_invoice template via WhatsApp API
 * Run: node scripts/test-partial-template.js <phone_number>
 */
require("dotenv").config();

const phone = process.argv[2] || "919876543210";
let formattedTo = phone.replace(/\D/g, "");
if (formattedTo.length === 10) formattedTo = "91" + formattedTo;

const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

const components = [
  {
    type: "header",
    parameters: [
      {
        type: "document",
        document: {
          link: "https://bharati-sweets-prod.onrender.com/receipts/booking_test.pdf",
          filename: "test_partial.pdf",
        },
      },
    ],
  },
  {
    type: "body",
    parameters: [
      { type: "text", text: "Test User" },
      { type: "text", text: "TEST123" },
      { type: "text", text: "Birthday" },
      { type: "text", text: "1000" },
      { type: "text", text: "700" },
      { type: "text", text: "300" },
    ],
  },
];

const payload = {
  messaging_product: "whatsapp",
  to: formattedTo,
  type: "template",
  template: {
    name: "partial_payment_invoice",
    language: { code: "en_US" },
    components: components,
  },
};

console.log("📤 Sending test partial_payment_invoice template...");
console.log("📱 To:", formattedTo);
console.log("📋 Full payload:\n", JSON.stringify(payload, null, 2));

fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then((res) => {
    console.log("\n📡 HTTP Status:", res.status);
    return res.json();
  })
  .then((data) => {
    console.log("📦 Meta Response:\n", JSON.stringify(data, null, 2));
    if (data.error) {
      console.log("\n❌ ERROR DETAILS:");
      console.log("   Code:", data.error.code);
      console.log("   Message:", data.error.message);
      console.log("   Error Subcode:", data.error.error_subcode);
      console.log("   FB Trace:", data.error.fbtrace_id);
    } else {
      console.log("\n✅ Message sent successfully! ID:", data.messages?.[0]?.id);
    }
  })
  .catch((err) => {
    console.error("❌ Fetch error:", err.message);
  });
