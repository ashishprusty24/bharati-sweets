/**
 * Quick test: Test final_invoice template with and without button
 */
require("dotenv").config();

const phone = "919876543210";
const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function testFinal(withButton) {
  const components = [
    {
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: "https://bharati-sweets-prod.onrender.com/receipts/booking_test.pdf",
            filename: "final_test.pdf",
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
        { type: "text", text: "1000" },
      ],
    },
  ];

  if (withButton) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: "receipts/final_test.pdf" }],
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: "final_invoice",
      language: { code: "en_US" },
      components: components,
    },
  };

  console.log(`\n--- Testing final_invoice (${withButton ? "WITH button" : "WITHOUT button"}) ---`);
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
  await testFinal(true);
  await testFinal(false);
}

run();
