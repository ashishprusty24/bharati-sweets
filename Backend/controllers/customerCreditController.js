const CustomerCredit = require("../models/CustomerCredit");
const EventOrder = require("../models/EventOrder");
const { sendWhatsApp } = require("../utils/whatsappService");

// ─── GET ALL BAKKI (CUSTOMER CREDIT) ENTRIES ─────────────────
const getAllBakkiEntries = async () => {
  // 1. Fetch standalone credit entries
  const standaloneCredits = await CustomerCredit.find().sort({ createdAt: -1 });

  // 2. Fetch event orders with pending dues (where totalSettled < totalAmount)
  const eventOrders = await EventOrder.find().sort({ createdAt: -1 });

  const eventBakkiList = eventOrders
    .filter((order) => {
      const settled = (order.paidAmount || 0) + (order.adminWaiver || 0);
      return (order.totalAmount || 0) - settled > 0;
    })
    .map((order) => {
      const settled = (order.paidAmount || 0) + (order.adminWaiver || 0);
      const balance = Math.max(0, (order.totalAmount || 0) - settled);
      return {
        _id: order._id.toString(),
        source: "event_order",
        customerName: order.customerName,
        phone: order.phone,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount || 0,
        adminWaiver: order.adminWaiver || 0,
        balance: balance,
        notes: `Event Order: ${order.purpose || "Event"}`,
        dueDate: order.deliveryDate,
        autoReminderEnabled: order.autoReminderEnabled !== false,
        status: order.paymentStatus || "pending",
        createdAt: order.createdAt,
      };
    });

  const standaloneBakkiList = standaloneCredits.map((c) => ({
    _id: c._id.toString(),
    source: "customer_credit",
    customerName: c.customerName,
    phone: c.phone,
    totalAmount: c.totalAmount,
    paidAmount: c.paidAmount,
    balance: c.balance,
    notes: c.notes || "Counter Credit (Bakki)",
    dueDate: c.dueDate,
    autoReminderEnabled: c.autoReminderEnabled !== false,
    status: c.status,
    createdAt: c.createdAt,
  }));

  const allEntries = [...standaloneBakkiList, ...eventBakkiList];

  const totalDues = allEntries.reduce((sum, item) => sum + item.balance, 0);
  const totalCustomers = allEntries.length;

  return {
    summary: {
      totalDues,
      totalCustomers,
      weeklyAutoReminderActive: true,
    },
    entries: allEntries,
  };
};

// ─── CREATE NEW STANDALONE BAKKI ENTRY ───────────────────────
const createBakkiEntry = async (data) => {
  const newCredit = new CustomerCredit({
    customerName: data.customerName,
    phone: data.phone,
    totalAmount: Number(data.totalAmount || 0),
    paidAmount: Number(data.paidAmount || 0),
    notes: data.notes || "",
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    autoReminderEnabled: data.autoReminderEnabled !== false,
  });

  if (data.paidAmount > 0) {
    newCredit.payments.push({
      amount: Number(data.paidAmount),
      method: data.method || "cash",
      date: new Date(),
    });
  }

  return await newCredit.save();
};

// ─── RECORD BAKKI PAYMENT ────────────────────────────────────
const recordBakkiPayment = async (id, source, paymentData) => {
  const amount = Number(paymentData.amount || 0);

  if (source === "event_order") {
    const eventOrderController = require("./eventOrderController");
    return await eventOrderController.addPayment(id, paymentData);
  } else {
    const credit = await CustomerCredit.findById(id);
    if (!credit) throw new Error("Bakki entry not found");

    credit.payments.push({
      amount,
      method: paymentData.method || "cash",
      date: paymentData.date || new Date(),
    });

    return await credit.save();
  }
};

// ─── TOGGLE AUTO REMINDER ───────────────────────────────────
const toggleAutoReminder = async (id, source, enabled) => {
  if (source === "event_order") {
    return await EventOrder.findByIdAndUpdate(
      id,
      { autoReminderEnabled: enabled },
      { new: true }
    );
  } else {
    return await CustomerCredit.findByIdAndUpdate(
      id,
      { autoReminderEnabled: enabled },
      { new: true }
    );
  }
};

// ─── SEND INDIVIDUAL WHATSAPP REMINDER ────────────────────────
const sendBakkiReminder = async (id, source) => {
  let customerName, phone, balance, orderInfo;

  if (source === "event_order") {
    const order = await EventOrder.findById(id);
    if (!order) throw new Error("Order not found");
    const settled = (order.paidAmount || 0) + (order.adminWaiver || 0);
    balance = Math.max(0, (order.totalAmount || 0) - settled);
    customerName = order.customerName;
    phone = order.phone;
    const shortId = order._id.toString().slice(-6).toUpperCase();
    orderInfo = `Event Order #${shortId} (${order.purpose || "Event"})`;
  } else {
    const credit = await CustomerCredit.findById(id);
    if (!credit) throw new Error("Bakki entry not found");
    balance = credit.balance;
    customerName = credit.customerName;
    phone = credit.phone;
    orderInfo = credit.notes || "Store Account (Bakki)";
  }

  if (!phone) throw new Error("Customer phone number missing");

  const messageText = `🔔 *Payment Reminder - Bharati Sweets*\nNamaste *${customerName}*! 🙏\n\nThis is a polite reminder regarding your pending balance amount for *${orderInfo}*.\n\n💰 *Pending Bakki Amount: ₹${balance.toLocaleString()}*\n\nPlease settle your payment at your earliest convenience or via UPI/Cash.\nThank you for choosing Bharati Sweets! 🍬`;

  await sendWhatsApp(phone, messageText);
  return { success: true, phone, message: "WhatsApp reminder sent successfully" };
};

// ─── TRIGGER WEEKLY AUTO REMINDERS ───────────────────────────
const triggerWeeklyAutoReminders = async () => {
  const { entries } = await getAllBakkiEntries();
  const eligibleEntries = entries.filter(
    (e) => e.balance > 0 && e.autoReminderEnabled && e.phone
  );

  let sentCount = 0;
  let failCount = 0;

  for (const entry of eligibleEntries) {
    try {
      await sendBakkiReminder(entry._id, entry.source);
      sentCount++;
    } catch (err) {
      console.error(`❌ Failed auto reminder for ${entry.customerName}:`, err.message);
      failCount++;
    }
  }

  return { total: eligibleEntries.length, sentCount, failCount };
};

module.exports = {
  getAllBakkiEntries,
  createBakkiEntry,
  recordBakkiPayment,
  toggleAutoReminder,
  sendBakkiReminder,
  triggerWeeklyAutoReminders,
};
