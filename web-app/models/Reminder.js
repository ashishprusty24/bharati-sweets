import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    secondaryName: { type: String },
    phone: { type: String, required: true },
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
