/**
 * WhatsApp Business API Service
 * Sends text messages and documents via Meta Graph API
 */

const sendWhatsApp = async (to, message) => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

    if (!token) {
      console.warn("⚠️ WhatsApp API token missing in process.env (WHATSAPP_API_TOKEN required)");
      return false;
    }

    // Format phone number: remove non-digits, add 91 country code if 10 digits
    let formattedTo = to.replace(/\D/g, "");
    if (formattedTo.length === 10) {
      formattedTo = "91" + formattedTo;
    }

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
 * @param {string} to - Phone number
 * @param {string} documentUrl - Public URL of the PDF
 * @param {string} filename - Display filename
 * @param {string} caption - Caption text shown with the document
 */
const sendWhatsAppDocument = async (to, documentUrl, filename, caption) => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "775800332280378";

    if (!token) {
      console.warn("⚠️ WhatsApp API token missing in process.env");
      return false;
    }

    let formattedTo = to.replace(/\D/g, "");
    if (formattedTo.length === 10) {
      formattedTo = "91" + formattedTo;
    }

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
      // If document send fails, try fallback text message with link
      console.log("🔄 Falling back to text message with link...");
      return await sendWhatsApp(to, `${caption}\n\n📄 Download: ${documentUrl}`);
    }

    console.log("✅ WhatsApp document sent successfully:", data.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp document send failed:", err.message);
    // Fallback to text
    try {
      return await sendWhatsApp(to, `${caption}\n\n📄 Download: ${documentUrl}`);
    } catch (fallbackErr) {
      console.error("❌ Fallback text also failed:", fallbackErr.message);
      return false;
    }
  }
};

module.exports = { sendWhatsApp, sendWhatsAppDocument };
