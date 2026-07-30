import dayjs from "dayjs";
import { LedgerRepository } from "../repositories/ledger.repository";

export class LedgerService {
  static async getLedgerByDate(date) {
    const targetDate = dayjs(date).startOf("day").toDate();
    let ledger = await LedgerRepository.findByDate(targetDate);

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
        cashToHome: 0,
        digitalToHome: 0,
        closingBalance: 0,
        closingBankBalance: 0,
        items: [],
      };
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

    return await LedgerRepository.saveOrUpdateLedger(targetDate, updatePayload);
  }
}
