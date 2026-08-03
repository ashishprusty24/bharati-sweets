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

    let homeIntakeTotal = 0;
    try {
      await connectDB();
      const homeExpenses = await HomeExpense.find({
        date: { $gte: targetDate, $lte: endOfDay },
      });
      homeIntakeTotal = homeExpenses
        .filter((e) => e.category === "personal" || e.paymentSource === "home_cash")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch (hErr) {
      console.error("Error auto-fetching home intake in web-app service:", hErr);
    }

    if (!ledger) {
      const prevDate = dayjs(date).subtract(1, "day").startOf("day").toDate();
      const prevLedger = await LedgerRepository.findPreviousDayLedger(prevDate);
      const openingBalance = prevLedger ? (prevLedger.closingBalance || 0) : 0;
      const openingBankBalance = prevLedger ? (prevLedger.closingBankBalance || 0) : 0;

      ledger = {
        date: targetDate,
        openingBalance,
        openingBankBalance,
        cashSales: 0,
        digitalSales: 0,
        totalExpenses: 0,
        otherIncome: 0,
        cashToHome: homeIntakeTotal,
        digitalToHome: 0,
        closingBalance: 0,
        closingBankBalance: 0,
        items: [],
      };
    } else if (!ledger.cashToHome && homeIntakeTotal > 0) {
      ledger.cashToHome = homeIntakeTotal;
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
    // Cash Sell = Closing Cash + Cash Expenses + Cash to Home - Opening Cash - Other Income
    const derivedCashSales =
      Number(ledgerObj.closingBalance || 0) +
      cashExpenseTotal +
      Number(ledgerObj.cashToHome || 0) -
      Number(ledgerObj.openingBalance || 0) -
      Number(ledgerObj.otherIncome || 0) -
      cashIncomeTotal;

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

    // Auto-sync items to HomeExpense and Vendor
    try {
      await connectDB();
      const endOfDay = dayjs(date).endOf("day").toDate();
      for (const item of items) {
        if (item.type === "expense" && item.description) {
          const exists = await HomeExpense.findOne({
            date: { $gte: targetDate, $lte: endOfDay },
            description: item.description,
            amount: Number(item.amount),
          });

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

          if (!exists) {
            const newExp = new HomeExpense({
              date: targetDate,
              description: item.description,
              amount: Number(item.amount) || 0,
              category: item.category || "other",
              paymentSource: item.paymentMode === "bank" ? "bank_account" : "home_cash",
              vendorId: vendor ? vendor._id : item.vendorId || null,
            });
            await newExp.save();
          }
        }
      }
    } catch (syncErr) {
      console.error("Web-app ledger save auto-sync error:", syncErr);
    }

    return await LedgerRepository.saveOrUpdateLedger(targetDate, updatePayload);
  }
}
