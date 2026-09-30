import mongoose from "mongoose";

const homeIntakeSettingSchema = new mongoose.Schema(
  {
    cashOpeningBalance: { type: Number, default: 0 },
    bankOpeningBalance: { type: Number, default: 0 },
    effectiveDate: { type: Date, default: () => new Date("2026-10-01T00:00:00.000Z") },
    notes: { type: String, default: "Home Intake Opening Balance as of 01 Oct 2026" },
  },
  { timestamps: true }
);

export default mongoose.models.HomeIntakeSetting ||
  mongoose.model("HomeIntakeSetting", homeIntakeSettingSchema);
