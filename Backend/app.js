const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/invoices", express.static(path.join(process.cwd(), "invoices")));
app.use("/receipts", express.static(path.join(process.cwd(), "receipts")));

// Routes
app.use("/api", apiRoutes);

// Catch-all route for status check
app.get("/status", (req, res) => {
  res.json({ success: true, message: "Bharati Sweets Backend is operational" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API Route not found" });
});

// Final Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
