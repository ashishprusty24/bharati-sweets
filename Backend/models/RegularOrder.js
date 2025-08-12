const mongoose = require("mongoose");

const regularOrderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const regularOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    items: [regularOrderItemSchema],
    payment: {
      amount: { type: Number, required: true },
      method: {
        type: String,
        enum: ["cash", "phonepay", "gpay", "card"],
        required: true,
      },
      cardId: String,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RegularOrder", regularOrderSchema);
