exports.sendWhatsApp = async (to, message, mediaUrl = null) => {
  try {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!token || !phoneNumberId) {
      console.warn("WhatsApp API credentials missing in .env");
      return false;
    }

    // Format phone number: remove any non-digit characters
    let formattedTo = to.replace(/\D/g, "");
    // Default to +91 if not provided (assume 10 digits)
    if (formattedTo.length === 10) {
      formattedTo = "91" + formattedTo;
    }

    const payload = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "text",
      text: { body: message }
    };

    console.log("Sending WhatsApp payload:", payload);

    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return false;
  }
};
