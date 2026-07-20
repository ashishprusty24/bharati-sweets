const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    secondaryName: { type: String }, // e.g. Spouse, Child
    phone: { type: String, required: true },
    eventType: { type: String, required: true }, // e.g. Birthday, Anniversary
    eventDate: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);
