import dayjs from "dayjs";
import { LedgerRepository } from "../repositories/ledger.repository";
import connectDB from "../database/mongodb";
import HomeExpense from "../models/HomeExpense";
import HomeIntakeSetting from "../models/HomeIntakeSetting";
import Vendor from "../models/Vendor";

export class LedgerService {
  static async getLedgerByDate(date) {
    const targetDate = dayjs(date).startOf("day").toDate();
    const endOfDay = dayjs(date).endOf("day").toDate();
    let ledger = await LedgerRepository.findByDate(targetDate);

    // Only count actual Home Intake entries (cash drawn from till to home)
    // Split by payment source to correctly account for cash vs bank
    let cashHomeIntake = 0;
    let bankHomeIntake = 0;
    try {
      await connectDB();
      const homeExpenses = await HomeExpense.find({
        date: { $gte: targetDate, $lte: endOfDay },
        category: "home_intake", // Only home_intake category — NOT shop cash expenses
      });
      cashHomeIntake = homeExpenses
        .filter((e) => e.paymentSource === "home_cash")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      bankHomeIntake = homeExpenses
        .filter((e) => e.paymentSource === "bank_account")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch (hErr) {
      console.error("Error auto-fetching home intake in web-app service:", hErr);
    }

    const prevDate = dayjs(date).subtract(1, "day").startOf("day").toDate();
    const prevLedger = await LedgerRepository.findPreviousDayLedger(prevDate);
    const prevClosingCash = prevLedger ? (Number(prevLedger.closingBalance) || 0) : 0;
    const prevClosingBank = prevLedger ? (Number(prevLedger.closingBankBalance) || 0) : 0;

    if (!ledger) {
      ledger = {
        date: targetDate,
        festival: "",
        sweetProduction: [],
        investments: [],
        openingBalance: prevClosingCash,
        openingBankBalance: prevClosingBank,
        cashSales: 0,
        digitalSales: 0,
        totalExpenses: 0,
        otherIncome: 0,
        cashToHome: cashHomeIntake,
        digitalToHome: bankHomeIntake,
        closingBalance: 0,
        closingBankBalance: 0,
        items: [],
      };
    } else {
      if (prevLedger) {
        ledger.openingBalance = prevClosingCash;
        ledger.openingBankBalance = prevClosingBank;
      }
      // Auto-populate from home intake if not already set manually
      if (!ledger.cashToHome && cashHomeIntake > 0) {
        ledger.cashToHome = cashHomeIntake;
      }
      if (!ledger.digitalToHome && bankHomeIntake > 0) {
        ledger.digitalToHome = bankHomeIntake;
      }
    }

    const ledgerObj = ledger.toObject ? ledger.toObject() : { ...ledger };
    const items = ledgerObj.items || [];

    const cashExpenseTotal = items
      .filter((i) => (i.type === "expense" || i.type === "investment") && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankExpenseTotal = items
      .filter((i) => (i.type === "expense" || i.type === "investment") && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalExpenses = items
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalInvestments = items
      .filter((i) => i.type === "investment")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    // Derived sell formula:
    // Cash Sell = Closing Cash + Cash Expenses + Cash Investments + Cash to Home - Opening Cash - Other Income
    const derivedCashSales =
      Number(ledgerObj.closingBalance || 0) +
      cashExpenseTotal +
      Number(ledgerObj.cashToHome || 0) -
      Number(ledgerObj.openingBalance || 0) -
      Number(ledgerObj.otherIncome || 0);

    // Digital Sell = Closing Bank + Bank Expenses + Bank Investments + Account to Home - Opening Bank
    const derivedDigitalSales =
      Number(ledgerObj.closingBankBalance || 0) +
      bankExpenseTotal +
      Number(ledgerObj.digitalToHome || 0) -
      Number(ledgerObj.openingBankBalance || 0);

    ledgerObj.derivedCashSales = derivedCashSales;
    ledgerObj.derivedDigitalSales = derivedDigitalSales;
    ledgerObj.derivedTotalSales = derivedCashSales + derivedDigitalSales;
    ledgerObj.totalExpenses = totalExpenses;
    ledgerObj.totalInvestments = totalInvestments;

    // Helper to compute home intake summary (with opening balance reconciliation)
    const computeHomeIntakeSummary = (expenses = [], setting = null, periodDate = null) => {
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

      const effectiveCutoff = setting?.effectiveDate
        ? dayjs(setting.effectiveDate).startOf("day")
        : dayjs("2026-10-01").startOf("day");

      // Opening balance applies if all-time (periodDate is null) or if the month is on/after cutoff month
      const isCutoffApplicable =
        !periodDate ||
        dayjs(periodDate).endOf("month").isAfter(effectiveCutoff) ||
        dayjs(periodDate).isSame(effectiveCutoff, "month");

      const cashOpening = isCutoffApplicable ? Number(setting?.cashOpeningBalance || 0) : 0;
      const bankOpening = isCutoffApplicable ? Number(setting?.bankOpeningBalance || 0) : 0;

      const remCash = cashOpening + receivedCash - spentCash;
      const remBank = bankOpening + receivedBank - spentBank;

      return {
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
          cash: remCash,
          bank: remBank,
          total: remCash + remBank,
        },
        total: receivedCash + receivedBank,
        cash: receivedCash,
        bank: receivedBank,
      };
    };

    try {
      await connectDB();
      let setting = null;
      try {
        setting = await HomeIntakeSetting.findOne();
      } catch (sErr) {
        console.error("Error loading HomeIntakeSetting in web-app ledger:", sErr);
      }

      const effectiveCutoff = setting?.effectiveDate
        ? dayjs(setting.effectiveDate).startOf("day")
        : dayjs("2026-10-01").startOf("day");

      const startOfMonth = dayjs(date).startOf("month").toDate();
      const endOfMonth = dayjs(date).endOf("month").toDate();

      const [monthExpenses, allExpenses] = await Promise.all([
        HomeExpense.find({
          date: { $gte: startOfMonth, $lte: endOfMonth },
          sourceTag: { $ne: "daily_ledger" },
          $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
        }),
        HomeExpense.find({
          date: { $gte: effectiveCutoff.toDate() },
          sourceTag: { $ne: "daily_ledger" },
          $or: [{ ledgerItemId: null }, { ledgerItemId: { $exists: false } }, { ledgerItemId: "" }],
        }),
      ]);

      ledgerObj.homeIntakeSummary = {
        ...computeHomeIntakeSummary(monthExpenses, setting, date),
        periodName: dayjs(date).format("MMMM YYYY"),
      };
      ledgerObj.allTimeHomeIntakeSummary = {
        ...computeHomeIntakeSummary(allExpenses, setting, null),
        periodName: `All-Time (from ${effectiveCutoff.format("DD MMM YYYY")})`,
      };
    } catch (sumErr) {
      console.error("Error computing home intake summary in web-app ledger service:", sumErr);
    }

    return ledgerObj;
  }

  static async saveLedger(date, payload) {
    const targetDate = dayjs(date).startOf("day").toDate();
    const {
      items = [],
      festival = "",
      sweetProduction = [],
      investments = [],
      customerCredits = [],
      openingBalance = 0,
      openingBankBalance = 0,
      otherIncome = 0,
      cashToHome = 0,
      digitalToHome = 0,
      closingBalance = 0,
      closingBankBalance = 0,
    } = payload;

    // Auto-sync items with type === "investment" into investments array
    let syncedInvestments = [...(investments || [])];
    for (const item of items) {
      if (item.type === "investment" && item.description && Number(item.amount) > 0) {
        const itemDesc = item.description.trim();
        const itemAmt = Number(item.amount);
        const alreadyExists = syncedInvestments.some(
          (inv) => inv.name?.toLowerCase().trim() === itemDesc.toLowerCase() && Number(inv.amount) === itemAmt
        );
        if (!alreadyExists) {
          let invType = "SIP";
          if (/fd|fixed deposit/i.test(itemDesc)) invType = "FD";
          else if (/sip|mutual fund|mf/i.test(itemDesc)) invType = "SIP";
          else invType = "Other";

          syncedInvestments.push({
            name: itemDesc,
            amount: itemAmt,
            type: invType,
            notes: `From daily ledger (${item.paymentMode || "cash"})`,
          });
        }
      }
    }

    // Auto-sync customer credits into CustomerCredit model and persist in DailyLedger.customerCredits
    let syncedCustomerCredits = [];
    try {
      await connectDB();
      const CustomerCredit = (await import("../models/CustomerCredit")).default;
      const endOfDay = dayjs(date).endOf("day").toDate();
      const dateStr = dayjs(date).format("YYYY-MM-DD");

      for (const item of customerCredits || []) {
        if (item.customerName && Number(item.amount) > 0) {
          const custName = item.customerName.trim();
          const custPhone = item.phone ? item.phone.trim() : "N/A";
          const custAmount = Number(item.amount);
          const custNotes = item.notes || `Counter Bakki from Daily Ledger (${dateStr})`;

          let creditDoc = null;
          if (item.creditId) {
            creditDoc = await CustomerCredit.findById(item.creditId);
          }
          if (!creditDoc) {
            creditDoc = await CustomerCredit.findOne({
              customerName: new RegExp(`^${custName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
              createdAt: { $gte: targetDate, $lte: endOfDay },
            });
          }

          if (creditDoc) {
            creditDoc.customerName = custName;
            if (custPhone && custPhone !== "N/A") creditDoc.phone = custPhone;
            creditDoc.totalAmount = custAmount;
            if (item.notes) creditDoc.notes = item.notes;
            await creditDoc.save();
          } else {
            creditDoc = new CustomerCredit({
              customerName: custName,
              phone: custPhone,
              totalAmount: custAmount,
              notes: custNotes,
              autoReminderEnabled: Boolean(custPhone && custPhone !== "N/A" && custPhone.length >= 10),
              createdAt: targetDate,
            });
            await creditDoc.save();
          }

          syncedCustomerCredits.push({
            customerName: custName,
            phone: custPhone,
            amount: custAmount,
            notes: item.notes || "",
            creditId: creditDoc._id,
          });
        }
      }
    } catch (ccErr) {
      console.error("Error auto-syncing customer credits in ledger service:", ccErr);
    }

    const totalExpenses = items
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const updatePayload = {
      festival: festival || "",
      sweetProduction: sweetProduction || [],
      investments: syncedInvestments,
      customerCredits: syncedCustomerCredits,
      openingBalance: Number(openingBalance),
      openingBankBalance: Number(openingBankBalance),
      otherIncome: Number(otherIncome),
      cashToHome: Number(cashToHome),
      digitalToHome: Number(digitalToHome),
      closingBalance: Number(closingBalance),
      closingBankBalance: Number(closingBankBalance),
      totalExpenses,
      items,
    };

    // --- AUTO SYNC CASH TO HOME & DIGITAL TO HOME (HOME INTAKE) ---
    try {
      await connectDB();
      const endOfDay = dayjs(date).endOf("day").toDate();

      if (Number(cashToHome) > 0) {
        await HomeExpense.findOneAndUpdate(
          {
            date: { $gte: targetDate, $lte: endOfDay },
            category: "home_intake",
            paymentSource: "home_cash",
          },
          {
            date: targetDate,
            description: "Cash taken home from shop",
            amount: Number(cashToHome),
            category: "home_intake",
            paymentSource: "home_cash",
            sourceTag: "direct",
          },
          { upsert: true, new: true }
        );
      } else {
        await HomeExpense.deleteMany({
          date: { $gte: targetDate, $lte: endOfDay },
          category: "home_intake",
          paymentSource: "home_cash",
        });
      }

      if (Number(digitalToHome) > 0) {
        await HomeExpense.findOneAndUpdate(
          {
            date: { $gte: targetDate, $lte: endOfDay },
            category: "home_intake",
            paymentSource: "bank_account",
          },
          {
            date: targetDate,
            description: "Digital funds transferred to home",
            amount: Number(digitalToHome),
            category: "home_intake",
            paymentSource: "bank_account",
            sourceTag: "direct",
          },
          { upsert: true, new: true }
        );
      } else {
        await HomeExpense.deleteMany({
          date: { $gte: targetDate, $lte: endOfDay },
          category: "home_intake",
          paymentSource: "bank_account",
        });
      }
    } catch (intakeErr) {
      console.error("Home intake sync error in web-app ledger service:", intakeErr);
    }

    // --- AUTO SYNC TO VENDORS ONLY ---
    try {
      await connectDB();
      for (const item of items) {
        if (item.type === "expense" && item.description) {
          const descName = item.description.trim();
          let vendor = await Vendor.findOne({ name: new RegExp("^" + descName + "$", "i") });
          if (!vendor && item.category === "supplier_payment") {
            vendor = new Vendor({
              name: descName,
              type: "other",
              contact: "Auto-created from Ledger",
              address: "N/A",
              rate: 0,
            });
            await vendor.save();
          }

          if (vendor) {
            const hasTx = (vendor.transactions || []).some(
              (t) =>
                dayjs(t.date).isSame(targetDate, "day") && Number(t.amount) === Number(item.amount)
            );
            if (!hasTx) {
              vendor.transactions.push({
                date: targetDate,
                quantity: 1,
                amount: Number(item.amount) || 0,
                paymentMethod: item.paymentMode === "bank" ? "bank" : "cash",
              });
              vendor.lastPaymentDate = targetDate;
              await vendor.save();
            }
          }
        }
      }
    await LedgerRepository.saveOrUpdateLedger(targetDate, updatePayload);
    return await this.getLedgerByDate(date);
  }
}


