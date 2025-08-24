var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const inventoryRoutes = require("./routes/inventoryRoutes");
const regularOrderRoutes = require("./routes/regularOrderRoutes");
const eventOrderRoutes = require("./routes/eventOrderRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const creditCardRoutes = require("./routes/creditCardRoutes");
const staffRoutes = require("./routes/staffRoutes");
const accountingRoutes = require("./routes/accountingRouter");
const dashboardRoutes = require("./routes/dashboardRouter");
const expenseRoutes = require("./routes/expenseRouter");
const authRoutes = require("./routes/authRoutes");

var app = express();
const PORT = process.env.PORT || 5000;

// View engine setup (optional if not serving HTML templates)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(cors()); // Allow frontend to connect
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/regular-orders", regularOrderRoutes);
app.use("/api/event-orders", eventOrderRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/credit-cards", creditCardRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);

app.use("/invoices", express.static(path.join(process.cwd(), "invoices")));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;

// BLNHE9791S3BN9WDWFNY6ERN
