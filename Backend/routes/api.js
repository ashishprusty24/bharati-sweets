const express = require("express");
const router = express.Router();

const inventoryRoutes = require("./inventoryRoutes");
const regularOrderRoutes = require("./regularOrderRoutes");
const eventOrderRoutes = require("./eventOrderRoutes");
const vendorRoutes = require("./vendorRoutes");
const creditCardRoutes = require("./creditCardRoutes");
const staffRoutes = require("./staffRoutes");
const accountingRoutes = require("./accountingRouter");
const dashboardRoutes = require("./dashboardRouter");
const expenseRoutes = require("./expenseRouter");
const authRoutes = require("./authRoutes");
const ledgerRoutes = require("./ledgerRoutes");
const customerRoutes = require("./customerRoutes");
const marketingRoutes = require("./marketingRoutes");

router.use("/inventory", inventoryRoutes);
router.use("/regular-orders", regularOrderRoutes);
router.use("/event-orders", eventOrderRoutes);
router.use("/vendors", vendorRoutes);
router.use("/credit-cards", creditCardRoutes);
router.use("/staff", staffRoutes);
router.use("/accounting", accountingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/expenses", expenseRoutes);
router.use("/auth", authRoutes);
router.use("/ledger", ledgerRoutes);
router.use("/customers", customerRoutes);
router.use("/marketing", marketingRoutes);

module.exports = router;

