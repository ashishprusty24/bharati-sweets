/**
 * WhatsApp Business API Service
 * Sends text messages, documents, and templates via Meta Graph API
 */

const formatPhone = (to) => {
  if (!to) return "";
  let formattedTo = String(to).replace(/\D/g, "");
  formattedTo = formattedTo.replace(/^0+/, "");
  if (formattedTo.length === 10) {
    formattedTo = "91" + formattedTo;
  }
  return formattedTo;
};

const sendWhatsApp = async (to, message) => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

    if (!token) {
      console.warn("⚠️ WhatsApp API token missing in process.env (WHATSAPP_API_TOKEN required)");
      return false;
    }

    let formattedTo = formatPhone(to);

    const payload = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "text",
      text: { body: message },
    };

    console.log("📤 Sending WhatsApp text to:", formattedTo);

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WhatsApp text API error:", response.status, JSON.stringify(data, null, 2));
      return false;
    }

    console.log("✅ WhatsApp text sent successfully:", data.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp text send failed:", err.message);
    return false;
  }
};

/**
 * Send a PDF document via WhatsApp
 */
const sendWhatsAppDocument = async (to, documentUrl, filename, caption) => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

    if (!token) {
      console.warn("⚠️ WhatsApp API token missing in process.env");
      return false;
    }

    let formattedTo = formatPhone(to);

    const payload = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "document",
      document: {
        link: documentUrl,
        filename: filename,
        caption: caption,
      },
    };

    console.log("📤 Sending WhatsApp document to:", formattedTo, "| File:", filename);

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WhatsApp document API error:", response.status, JSON.stringify(data, null, 2));
      console.log("🔄 Falling back to text message with link...");
      return await sendWhatsApp(to, `${caption}\n\n📄 Download: ${documentUrl}`);
    }

    console.log("✅ WhatsApp document sent successfully:", data.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp document send failed:", err.message);
    try {
      return await sendWhatsApp(to, `${caption}\n\n📄 Download: ${documentUrl}`);
    } catch (fallbackErr) {
      console.error("❌ Fallback text also failed:", fallbackErr.message);
      return false;
    }
  }
};

/**
 * Send a WhatsApp Template message with Header Document, Body parameters, and Button parameter
 */
const sendWhatsAppTemplate = async (to, templateName, components, languageCode = "en_US") => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

    if (!token) {
      console.warn("⚠️ WhatsApp API token missing in process.env");
      return false;
    }

    let formattedTo = formatPhone(to);

    const payload = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components,
      },
    };

    console.log("📤 Sending WhatsApp template:", templateName, "to:", formattedTo);
    console.log("📋 Template payload:", JSON.stringify(payload, null, 2));

    let response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    let data = await response.json();

    // If template doesn't exist in specified language (code 132001), automatically retry with alternative English code
    if (!response.ok && data.error?.code === 132001) {
      const altLang = languageCode === "en_US" ? "en" : "en_US";
      console.log(`🔄 Template "${templateName}" not found in "${languageCode}", retrying with "${altLang}"...`);
      payload.template.language.code = altLang;

      response = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      data = await response.json();
    }

    if (!response.ok) {
      console.error(`❌ WhatsApp template "${templateName}" API error:`, response.status, JSON.stringify(data, null, 2));
      console.error(`💡 If error is "template not found", create template "${templateName}" in Meta Business Suite → WhatsApp Manager → Message Templates`);
      return false;
    }

    console.log(`✅ WhatsApp template "${templateName}" sent successfully:`, data.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error(`❌ WhatsApp template "${templateName}" send failed:`, err.message);
    return false;
  }
};

module.exports = { sendWhatsApp, sendWhatsAppDocument, sendWhatsAppTemplate };
