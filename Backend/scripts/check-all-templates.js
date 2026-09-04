require("dotenv").config();

const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";
const phone = "919876543210";

async function testTemplate(name, langCode) {
  const components = [
    {
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: "https://bharati-sweets-prod.onrender.com/receipts/booking_test.pdf",
            filename: `${name}_test.pdf`,
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
        { type: "text", text: "1000" },
        { type: "text", text: "700" },
        { type: "text", text: "300" },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: "receipts/test.pdf" }],
    },
  ];

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: name,
      language: { code: langCode },
      components: components,
    },
  };

  console.log(`\n--- Testing ${name} with language: "${langCode}" ---`);
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
  for (const t of ["booking_receipt", "partial_payment_invoice", "final_invoice"]) {
    await testTemplate(t, "en_US");
  }
}

run();
