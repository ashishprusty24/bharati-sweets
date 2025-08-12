// routes/staffRoutes.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

router.get("/", staffController.getAllStaff);
router.post("/", staffController.createStaff);
router.put("/:id", staffController.updateStaff);
router.delete("/:id", staffController.deleteStaff);
router.post("/:id/attendance", staffController.recordAttendance);

module.exports = router;
