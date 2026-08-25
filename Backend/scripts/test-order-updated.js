/**
 * Test order_updated template directly against Meta API
 */
require("dotenv").config();

const phone = "919876543210";
const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function testOrderUpdated(withButton) {
  const components = [
    {
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: "https://bharati-sweets-prod.onrender.com/receipts/booking_test.pdf",
            filename: "order_updated_test.pdf",
          },
        },
      ],
    },
    {
      type: "body",
      parameters: [
        { type: "text", text: "Test Customer" },
        { type: "text", text: "ORDER123" },
        { type: "text", text: "Wedding" },
        { type: "text", text: "5000" },
        { type: "text", text: "2000" },
        { type: "text", text: "3000" },
      ],
    },
  ];

  if (withButton) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: "receipts/test.pdf" }],
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: "order_updated",
      language: { code: "en_US" },
      components: components,
    },
  };

  console.log(`\n--- Testing order_updated (${withButton ? "WITH button" : "WITHOUT button"}) ---`);
  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

async function run() {
  await testOrderUpdated(false);
  await testOrderUpdated(true);
}

run();
