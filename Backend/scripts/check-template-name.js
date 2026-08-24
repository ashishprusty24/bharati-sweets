require("dotenv").config();

const phone = "919876543210";
const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function testLang(name, lang) {
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

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: name,
      language: { code: lang },
      components: components,
    },
  };

  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log(`[${name}] [${lang}] -> Status:`, res.status, data.messages?.[0]?.id || data.error?.message);
}

async function run() {
  for (const name of ["order_updated", "event_order_updated", "order_update", "update_order"]) {
    for (const lang of ["en_US", "en", "en_GB", "en_IN"]) {
      await testLang(name, lang);
    }
  }
}

run();
