const mongoose = require("mongoose");

const marketingTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Festival", "Event", "Promotion", "Seasonal", "Custom"],
      required: true,
    },
    content: { type: String, required: true },
    platforms: [
      {
        type: String,
        enum: ["whatsapp", "facebook", "instagram"],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketingTemplate", marketingTemplateSchema);
