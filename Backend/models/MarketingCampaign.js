const mongoose = require("mongoose");

const marketingCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    platform: {
      type: String,
      enum: ["whatsapp", "facebook", "instagram"],
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingTemplate",
      default: null,
    },
    message: { type: String, default: "" },
    recipients: [
      {
        phone: String,
        customerName: String,
      },
    ],
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "completed"],
      default: "draft",
    },
    analytics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      ordersGenerated: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketingCampaign", marketingCampaignSchema);
