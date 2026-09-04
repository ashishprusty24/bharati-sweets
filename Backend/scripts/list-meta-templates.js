require("dotenv").config();

const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

async function getWabaTemplates() {
  const res1 = await fetch(`https://graph.facebook.com/v22.0/me/client_whatsapp_business_accounts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log("Client WABA accounts:", data1);

  if (data1.data && data1.data[0]) {
    const wabaId = data1.data[0].id;
    const tplRes = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/message_templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tplData = await tplRes.json();
    console.log(`\n📋 TEMPLATES IN WABA (${wabaId}):`);
    if (tplData.data) {
      tplData.data.forEach((tpl) => {
        console.log(`- Name: "${tpl.name}" | Status: ${tpl.status} | Lang: ${tpl.language} | Category: ${tpl.category}`);
      });
    } else {
      console.log("Tpl error:", tplData);
    }
  }
}

getWabaTemplates();
