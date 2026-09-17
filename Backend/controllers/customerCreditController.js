const CustomerCredit = require("../models/CustomerCredit");
const { sendWhatsApp, sendWhatsAppTemplate } = require("../utils/whatsappService");

// ─── GET ALL BAKKI (CUSTOMER CREDIT) ENTRIES ─────────────────
const getAllBakkiEntries = async () => {
  const credits = await CustomerCredit.find().sort({ createdAt: -1 });

  const entries = credits.map((c) => {
    let payments = c.payments || [];
    if (payments.length === 0 && (c.paidAmount > 0)) {
      payments = [{
        amount: c.paidAmount,
        method: "cash",
        date: c.createdAt || new Date(),
      }];
    }

    return {
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
      payments: payments,
      createdAt: c.createdAt,
    };
  });

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

  const { customerName, phone, totalAmount = 0, paidAmount = 0, balance = 0 } = credit;
  const orderInfo = credit.notes || "Bakki Account";

  if (!phone) throw new Error("Customer phone number missing");

  // Attempt 1: Send via Meta Template "payment_reminder" (English US - 5 parameters matching Meta Manager)
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName || "Customer" },
        { type: "text", text: orderInfo || "Bakki" },
        { type: "text", text: `${totalAmount}` },
        { type: "text", text: `${paidAmount}` },
        { type: "text", text: `${balance}` },
      ],
    },
  ];

  let templateSent = await sendWhatsAppTemplate(phone, "payment_reminder", components, "en_US");
  if (!templateSent) {
    templateSent = await sendWhatsAppTemplate(phone, "payment_reminder", components, "en");
  }

  if (!templateSent) {
    // Attempt 2: Fallback to direct text message
    const messageText = `🔔 *Payment Reminder - Bharati Sweets*\nNamaste *${customerName}*! 🙏\n\nThis is a polite reminder regarding your pending balance amount for *${orderInfo}*.\n\n💰 *Total Amount: ₹${totalAmount.toLocaleString()}*\n💵 *Amount Paid: ₹${paidAmount.toLocaleString()}*\n⏳ *Pending Balance: ₹${balance.toLocaleString()}*\n\nPlease settle your payment at your earliest convenience. Thank you! 🍬`;
    await sendWhatsApp(phone, messageText);
  }

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

// ─── DELETE BAKKI ENTRY ─────────────────────────────────────
const deleteBakkiEntry = async (id) => {
  const deleted = await CustomerCredit.findByIdAndDelete(id);
  if (!deleted) throw new Error("Bakki entry not found");
  return { message: "Bakki entry deleted successfully" };
};

// ─── GET PAYMENT HISTORY TABULAR REPORT ──────────────────────
const getPaymentHistoryReport = async (query = {}) => {
  const filter = {};
  if (query.customerId) {
    filter._id = query.customerId;
  }
  if (query.phone) {
    filter.phone = new RegExp(query.phone, "i");
  }

  let startDate = null;
  if (query.startDate && query.startDate !== "undefined" && query.startDate !== "null" && query.startDate !== "all") {
    const d = new Date(query.startDate);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      startDate = d;
    }
  }

  let endDate = null;
  if (query.endDate && query.endDate !== "undefined" && query.endDate !== "null" && query.endDate !== "all") {
    const d = new Date(query.endDate);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      endDate = d;
    }
  }

  const credits = await CustomerCredit.find(filter).sort({ createdAt: -1 });
  const paymentRows = [];

  credits.forEach((credit) => {
    const totalAmount = credit.totalAmount || 0;
    let cumulativePaid = 0;

    let payments = credit.payments || [];
    if (payments.length === 0 && credit.paidAmount > 0) {
      payments = [{
        amount: credit.paidAmount,
        method: "cash",
        date: credit.createdAt || new Date(),
      }];
    }

    payments.forEach((p, index) => {
      cumulativePaid += Number(p.amount || 0);
      const remainingBalance = Math.max(0, totalAmount - cumulativePaid);
      const pDate = p.date || p.timestamp || credit.createdAt;

      if (pDate && !isNaN(new Date(pDate).getTime())) {
        const paymentDate = new Date(pDate);
        if (startDate && paymentDate < startDate) return;
        if (endDate && paymentDate > endDate) return;
      }

      paymentRows.push({
        recordId: credit._id.toString(),
        customerName: credit.customerName,
        phone: credit.phone,
        notes: credit.notes || "Bakki Dues",
        totalAmount,
        installmentNo: index + 1,
        date: pDate,
        amountPaid: Number(p.amount || 0),
        method: p.method || "cash",
        cumulativePaid,
        remainingBalance,
        status: remainingBalance === 0 ? "Fully Paid" : "Partial",
      });
    });
  });

  return {
    totalRecords: paymentRows.length,
    paymentHistory: paymentRows,
  };
};

module.exports = {
  getAllBakkiEntries,
  createBakkiEntry,
  recordBakkiPayment,
  toggleAutoReminder,
  sendBakkiReminder,
  triggerWeeklyAutoReminders,
  deleteBakkiEntry,
  getPaymentHistoryReport,
};

