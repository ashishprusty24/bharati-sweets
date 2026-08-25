require("dotenv").config();

const phone = "919876543210";
const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function testOrderUpdatedLang(langCode) {
  const components = [
    {
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: "https://bharati-sweets-prod.onrender.com/receipts/booking_test.pdf",
            filename: "updated_invoice.pdf",
          },
        },
      ],
    },
    {
      type: "body",
      parameters: [
        { type: "text", text: "Ashish" },
        { type: "text", text: "123" },
        { type: "text", text: "marriage" },
        { type: "text", text: "100" },
        { type: "text", text: "10" },
        { type: "text", text: "90" },
      ],
    },
  ];

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: "order_updated",
      language: { code: langCode },
      components: components,
    },
  };

  console.log(`\nTesting order_updated with language: "${langCode}"...`);
  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log(`Status [${langCode}]:`, res.status);
  console.log(`Response [${langCode}]:`, JSON.stringify(data, null, 2));
}

async function run() {
  for (const lang of ["en", "en_US", "en_GB", "en_IN"]) {
    await testOrderUpdatedLang(lang);
  }
}

run();
