require("dotenv").config();

const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function getWabaTemplates() {
  // First get WABA ID from phone number ID
  const phoneRes = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const phoneData = await phoneRes.json();
  console.log("Phone data:", phoneData);

  // If we can get message_templates
  if (phoneData.whatsapp_business_account) {
    const wabaId = phoneData.whatsapp_business_account.id;
    const tplRes = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/message_templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tplData = await tplRes.json();
    console.log("Templates list:", tplData);
  }
}

getWabaTemplates();
