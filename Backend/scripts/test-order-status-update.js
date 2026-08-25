require("dotenv").config();

const phone = "919876543210";
const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function testOrderStatusUpdate() {
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: "Rahul" },
        { type: "text", text: "68A1B2" },
        { type: "text", text: "Wedding" },
        { type: "text", text: "PREPARING" },
        { type: "text", text: "25 Aug 2026" },
      ],
    },
  ];

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: "order_status_update",
      language: { code: "en_US" },
      components: components,
    },
  };

  console.log("\nTesting order_status_update with language: en_US...");
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

testOrderStatusUpdate();
