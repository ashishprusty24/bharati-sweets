const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

exports.sendWhatsApp = async (to, message, mediaUrl = null) => {
  try {
    const payload = {
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+917008914616`,
    };

    console.log(999, payload);


    await client.messages.create(payload);
    return true;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return false;
  }
};
