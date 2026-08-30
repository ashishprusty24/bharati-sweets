const CustomerCredit = require("../models/CustomerCredit");
const { sendWhatsApp } = require("../utils/whatsappService");

// ─── GET ALL BAKKI (CUSTOMER CREDIT) ENTRIES ─────────────────
const getAllBakkiEntries = async () => {
  const credits = await CustomerCredit.find().sort({ createdAt: -1 });

  const entries = credits.map((c) => ({
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

  const totalDues = entries.reduce((sum, item) => sum + item.balance, 0);
  const totalCustomers = entries.length;

  return {
    summary: {
      totalDues,
      totalCustomers,
      weeklyAutoReminderActive: true,
    },
    entries,
  };
};

// ─── CREATE NEW BAKKI ENTRY ──────────────────────────────────
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

  const credit = await CustomerCredit.findById(id);
  if (!credit) throw new Error("Bakki entry not found");

  credit.payments.push({
    amount,
    method: paymentData.method || "cash",
    date: paymentData.date || new Date(),
  });

  return await credit.save();
};

// ─── TOGGLE AUTO REMINDER ───────────────────────────────────
const toggleAutoReminder = async (id, source, enabled) => {
  return await CustomerCredit.findByIdAndUpdate(
    id,
    { autoReminderEnabled: enabled },
    { new: true }
  );
};

// ─── SEND INDIVIDUAL WHATSAPP REMINDER ────────────────────────
const sendBakkiReminder = async (id, source) => {
  const credit = await CustomerCredit.findById(id);
  if (!credit) throw new Error("Bakki entry not found");

  const { customerName, phone, balance } = credit;
  const orderInfo = credit.notes || "Store Account (Bakki)";

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
