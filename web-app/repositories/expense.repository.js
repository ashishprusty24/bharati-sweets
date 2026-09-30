import connectDB from "../database/mongodb";
import Expense from "../models/Expense";
import HomeExpense from "../models/HomeExpense";
import HomeIntakeSetting from "../models/HomeIntakeSetting";
import Vendor from "../models/Vendor";

export class ExpenseRepository {
  static async findAllExpenses() {
    await connectDB();
    return await Expense.find().sort({ date: -1 });
  }

  static async createExpense(data) {
    await connectDB();
    const expense = new Expense(data);
    return await expense.save();
  }

  static async updateExpense(id, data) {
    await connectDB();
    return await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  static async deleteExpense(id) {
    await connectDB();
    return await Expense.findByIdAndDelete(id);
  }

  // Home Expenses
  static async findHomeExpenses(filter = {}) {
    await connectDB();
    return await HomeExpense.find(filter)
      .populate("staffId", "name")
      .populate("vendorId", "name")
      .populate("creditCardId", "cardName last4Digits")
      .sort({ date: -1 });
  }

  static async createHomeExpense(data) {
    await connectDB();

    if (data.description && data.category !== "personal") {
      try {
        const vendorName = data.description.trim();
        let vendor = null;
        if (data.vendorId) {
          vendor = await Vendor.findById(data.vendorId);
        } else {
          vendor = await Vendor.findOne({ name: new RegExp("^" + vendorName + "$", "i") });
        }

        if (!vendor) {
          vendor = new Vendor({
            name: vendorName,
            type: data.category === "supplier_payment" ? "flour" : "other",
            contact: "Auto-created from Expense",
            address: "N/A",
            rate: 0,
          });
          await vendor.save();
        }

        if (vendor) {
          data.vendorId = vendor._id;
          const txDate = data.date ? new Date(data.date) : new Date();
          vendor.transactions.push({
            date: txDate,
            quantity: 1,
            amount: Number(data.amount) || 0,
            paymentMethod: data.paymentSource === "bank_account" ? "bank" : "cash",
          });
          vendor.lastPaymentDate = txDate;
          await vendor.save();
        }
      } catch (vErr) {
        console.error("Auto-vendor creation error in web-app createHomeExpense:", vErr);
      }
    }

    // Auto-sync to CreditCard if paid via credit_card
    if (data.paymentSource === "credit_card" || data.category === "credit_card_bill") {
      try {
        const CreditCard = (await import("../models/CreditCard")).default;
        const cardId = data.creditCardId?._id || data.creditCardId;
        const card = cardId ? await CreditCard.findById(cardId) : await CreditCard.findOne();
        if (card) {
          if (data.category === "credit_card_bill") {
            card.billPayments.push({
              date: data.date ? new Date(data.date) : new Date(),
              amount: Number(data.amount) || 0,
              paidFrom: data.paymentSource === "bank_account" ? "bank_account" : "home_cash",
              notes: data.notes || data.description || "Bill payment from Home Expense",
            });
          } else {
            card.transactions.push({
              date: data.date ? new Date(data.date) : new Date(),
              description: data.description || "Expense via Credit Card",
              notes: data.notes || data.description || "",
              amount: Number(data.amount) || 0,
              category: "business",
              isSettled: false,
            });
          }
          await card.save();
        }
      } catch (ccErr) {
        console.error("Credit card transaction sync error in web-app createHomeExpense:", ccErr);
      }
    }

    const expense = new HomeExpense(data);
    const saved = await expense.save();
    return await HomeExpense.findById(saved._id)
      .populate("staffId", "name")
      .populate("vendorId", "name")
      .populate("creditCardId", "cardName last4Digits");
  }

  static async getHomeExpenseSummary(query = {}) {
    await connectDB();
    const dayjs = (await import("dayjs")).default;
    let filter = {
      sourceTag: { $ne: "daily_ledger" },
      $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
    };

    let setting = null;
    try {
      setting = await HomeIntakeSetting.findOne();
    } catch (sErr) {
      console.error("Error loading HomeIntakeSetting in web-app repository:", sErr);
    }

    const effectiveCutoff = setting?.effectiveDate
      ? dayjs(setting.effectiveDate).startOf("day")
      : dayjs("2026-10-01").startOf("day");

    let startDate, endDate;
    if (query.allTime === "true" || query.period === "all" || (!query.startDate && query.allTime)) {
      // For all time, start from effective cutoff date to reconcile historical unrecorded deficits
      filter.date = { $gte: effectiveCutoff.toDate() };
    } else {
      startDate = query.startDate
        ? dayjs(query.startDate).startOf("day").toDate()
        : dayjs().startOf("month").toDate();
      endDate = query.endDate
        ? dayjs(query.endDate).endOf("day").toDate()
        : dayjs().endOf("month").toDate();
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await HomeExpense.find(filter);
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
      return acc;
    }, {});
    const bySource = expenses.reduce((acc, e) => {
      acc[e.paymentSource] = (acc[e.paymentSource] || 0) + (e.amount || 0);
      return acc;
    }, {});

    const isIntakeCat = (c = "") => {
      const n = String(c).toLowerCase().trim();
      return n === "home_intake" || n === "home intake" || n === "personal" || n === "intake";
    };

    const intakeEntries = expenses.filter((e) => isIntakeCat(e.category));
    const receivedCash = intakeEntries
      .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const receivedBank = intakeEntries
      .filter((e) => e.paymentSource === "bank_account")
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const spentEntries = expenses.filter((e) => !isIntakeCat(e.category));
    const spentCash = spentEntries
      .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const spentBank = spentEntries
      .filter((e) => e.paymentSource === "bank_account")
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const spentCreditCard = spentEntries
      .filter((e) => e.paymentSource === "credit_card")
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const spentCCLoan = spentEntries
      .filter((e) => e.paymentSource === "cc_loan")
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // Opening balance applies if all-time or queried period includes/follows the cutoff date
    const isCutoffApplicable =
      !startDate ||
      dayjs(endDate).isAfter(effectiveCutoff) ||
      dayjs(endDate).isSame(effectiveCutoff, "day") ||
      dayjs(startDate).isSame(effectiveCutoff, "month");

    const cashOpening = isCutoffApplicable ? Number(setting?.cashOpeningBalance || 0) : 0;
    const bankOpening = isCutoffApplicable ? Number(setting?.bankOpeningBalance || 0) : 0;

    const remainingCash = cashOpening + receivedCash - spentCash;
    const remainingBank = bankOpening + receivedBank - spentBank;

    return {
      total,
      count: expenses.length,
      byCategory,
      bySource,
      homeIntakeSummary: {
        totalReceived: receivedCash + receivedBank,
        totalSpent: spentCash + spentBank,
        openingBalance: {
          cash: Number(setting?.cashOpeningBalance || 0),
          bank: Number(setting?.bankOpeningBalance || 0),
          total: Number(setting?.cashOpeningBalance || 0) + Number(setting?.bankOpeningBalance || 0),
          effectiveDate: effectiveCutoff.format("YYYY-MM-DD"),
          notes: setting?.notes || "",
          isApplied: isCutoffApplicable,
        },
        received: { cash: receivedCash, bank: receivedBank },
        spent: { cash: spentCash, bank: spentBank, creditCard: spentCreditCard, ccLoan: spentCCLoan },
        remaining: {
          cash: remainingCash,
          bank: remainingBank,
          total: remainingCash + remainingBank,
        },
        total: receivedCash + receivedBank,
        cash: receivedCash,
        bank: receivedBank,
      },
      period: { startDate, endDate },
    };
  }

  static async getHomeIntakeSetting() {
    await connectDB();
    let setting = await HomeIntakeSetting.findOne();
    if (!setting) {
      setting = await HomeIntakeSetting.create({
        cashOpeningBalance: 0,
        bankOpeningBalance: 0,
        effectiveDate: new Date("2026-10-01T00:00:00.000Z"),
        notes: "",
      });
    }
    return setting;
  }

  static async saveHomeIntakeSetting(data) {
    await connectDB();
    const payload = {
      cashOpeningBalance: Number(data.cashOpeningBalance || 0),
      bankOpeningBalance: Number(data.bankOpeningBalance || 0),
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date("2026-10-01T00:00:00.000Z"),
      notes: data.notes || "",
    };
    let setting = await HomeIntakeSetting.findOne();
    if (setting) {
      setting = await HomeIntakeSetting.findByIdAndUpdate(setting._id, payload, { new: true, upsert: true });
    } else {
      setting = await HomeIntakeSetting.create(payload);
    }
    return setting;
  }
}
