// models/Staff.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ["present", "absent", "late", "leave"],
    default: "present",
  },
});

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  contact: { type: String, required: true },
  salary: { type: Number, required: true },
  attendance: [attendanceSchema],
});

module.exports = mongoose.model("Staff", staffSchema);
