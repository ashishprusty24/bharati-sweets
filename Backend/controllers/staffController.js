// controllers/staffController.js
const Staff = require("../models/Staff");

// Get all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new staff member
exports.createStaff = async (req, res) => {
  const staff = new Staff(req.body);

  try {
    const newStaff = await staff.save();
    res.status(201).json(newStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update staff member
exports.updateStaff = async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: "Staff member deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Record staff attendance
exports.recordAttendance = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const attendance = {
      date: req.body.date,
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      status: req.body.status,
    };

    staff.attendance.push(attendance);
    const updatedStaff = await staff.save();
    res.json(updatedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
