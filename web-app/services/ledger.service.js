import dayjs from "dayjs";
import { LedgerRepository } from "../repositories/ledger.repository";
import connectDB from "../database/mongodb";
import HomeExpense from "../models/HomeExpense";
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
      .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankExpenseTotal = items
      .filter((i) => i.type === "expense" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const cashIncomeTotal = items
      .filter((i) => i.type === "income" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankIncomeTotal = items
      .filter((i) => i.type === "income" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalExpenses = cashExpenseTotal + bankExpenseTotal;

    // Derived sell formula:
    // Cash Sell = Closing Cash + Cash Expenses + Cash to Home - Opening Cash - Other Income - Cash Income
    const derivedCashSales =
      Number(ledgerObj.closingBalance || 0) +
      cashExpenseTotal +
      Number(ledgerObj.cashToHome || 0) -
      Number(ledgerObj.openingBalance || 0) -
      Number(ledgerObj.otherIncome || 0) -
      cashIncomeTotal;

    // Digital Sell = Closing Bank + Bank Expenses + Account to Home - Opening Bank - Bank Income
    const derivedDigitalSales =
      Number(ledgerObj.closingBankBalance || 0) +
      bankExpenseTotal +
      Number(ledgerObj.digitalToHome || 0) -
      Number(ledgerObj.openingBankBalance || 0) -
      bankIncomeTotal;

    ledgerObj.derivedCashSales = derivedCashSales;
    ledgerObj.derivedDigitalSales = derivedDigitalSales;
    ledgerObj.derivedTotalSales = derivedCashSales + derivedDigitalSales;
    ledgerObj.totalExpenses = totalExpenses;

    return ledgerObj;
  }

  static async saveLedger(date, payload) {
    const targetDate = dayjs(date).startOf("day").toDate();
    const {
      items = [],
      festival = "",
      sweetProduction = [],
      openingBalance = 0,
      openingBankBalance = 0,
      otherIncome = 0,
      cashToHome = 0,
      digitalToHome = 0,
      closingBalance = 0,
      closingBankBalance = 0,
    } = payload;

    const totalExpenses = items
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const updatePayload = {
      festival: festival || "",
      sweetProduction: sweetProduction || [],
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
    } catch (syncErr) {
      console.error("Web-app ledger save vendor-sync error:", syncErr);
    }

    return await LedgerRepository.saveOrUpdateLedger(targetDate, updatePayload);
  }
}


