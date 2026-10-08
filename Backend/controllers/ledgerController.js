const DailyLedger = require("../models/DailyLedger");
const HomeExpense = require("../models/HomeExpense");
const HomeIntakeSetting = require("../models/HomeIntakeSetting");
const Vendor = require("../models/Vendor");
const CustomerCredit = require("../models/CustomerCredit");
const dayjs = require("dayjs");

const isIntakeCategory = (cat = "") => {
  const norm = String(cat).toLowerCase().trim();
  return (
    norm === "home_intake" ||
    norm === "home intake" ||
    norm === "intake"
  );
};

const computeHomeIntakeSummary = (expenses = [], setting = null, periodDate = null) => {
  const intakeEntries = expenses.filter((e) => isIntakeCategory(e.category));
  const receivedCash = intakeEntries
    .filter((e) => e.paymentSource === "home_cash" || !e.paymentSource)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const receivedBank = intakeEntries
    .filter((e) => e.paymentSource === "bank_account")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const spentEntries = expenses.filter((e) => !isIntakeCategory(e.category));
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

  const remainingCash = cashOpening + receivedCash - spentCash;
  const remainingBank = bankOpening + receivedBank - spentBank;
  const remainingTotal = remainingCash + remainingBank;

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
      cash: remainingCash,
      bank: remainingBank,
      total: remainingTotal,
    },
    // Compatibility fields
    total: receivedCash + receivedBank,
    cash: receivedCash,
    bank: receivedBank,
  };
};

const getLedgerByDate = (date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);


      let ledger = await DailyLedger.findOne({ date: targetDate });

      // Only count actual Home Intake entries — split cash vs bank
      // Do NOT include all home_cash expenses (would incorrectly include shop expenses)
      let cashHomeIntake = 0;
      let bankHomeIntake = 0;
      try {
        const homeIntakeExpenses = await HomeExpense.find({
          date: { $gte: targetDate, $lte: endOfDay },
          category: "home_intake",
        });
        cashHomeIntake = homeIntakeExpenses
          .filter((e) => e.paymentSource === "home_cash")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        bankHomeIntake = homeIntakeExpenses
          .filter((e) => e.paymentSource === "bank_account")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      } catch (hErr) {
        console.error("Error auto-fetching home intake:", hErr);
      }

      // Fetch previous day's ledger to auto-fill/sync opening balance
      const prevDay = dayjs(date).subtract(1, "day").startOf("day").toDate();
      const prevLedger = await DailyLedger.findOne({ date: prevDay });
      const prevClosingCash = prevLedger ? (Number(prevLedger.closingBalance) || 0) : 0;
      const prevClosingBank = prevLedger ? (Number(prevLedger.closingBankBalance) || 0) : 0;

      if (!ledger) {
        // New day — auto-fill opening from previous day's closing (physical count)
        ledger = new DailyLedger({
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
        });
      } else {
        // If previous day exists, auto-sync opening balance from previous day's closing balance
        if (prevLedger) {
          ledger.openingBalance = prevClosingCash;
          ledger.openingBankBalance = prevClosingBank;
        }
        // Auto-populate if not already set manually
        if (!ledger.cashToHome && cashHomeIntake > 0) ledger.cashToHome = cashHomeIntake;
        if (!ledger.digitalToHome && bankHomeIntake > 0) ledger.digitalToHome = bankHomeIntake;
      }

      // Compute derived sell from the formula:
      // Sell = ClosingBalance + Expenses + CashToHome - OpeningBalance - OtherIncome
      const ledgerObj = ledger.toObject ? ledger.toObject() : { ...ledger };
      // Helper to check if category or payment source is CC/Loan or Credit Card
      const isCCExpense = (exp) => {
        const cat = String(exp.category || "").toLowerCase().trim();
        const src = String(exp.paymentSource || "").toLowerCase().trim();
        const desc = String(exp.description || "").toLowerCase().trim();
        return (
          src === "cc_loan" ||
          src === "credit_card" ||
          cat === "cc_loan" ||
          cat === "cc_loan_repayment" ||
          cat === "credit_card_bill" ||
          desc.startsWith("cc loan:") ||
          desc.startsWith("cc loan -")
        );
      };

      // Filter out any CC loan / credit card items that might have been saved in ledgerObj.items
      const items = (ledgerObj.items || []).filter(
        (i) => !isCCExpense(i)
      );

      // NOTE: Home Expenses are NOT merged into Daily Ledger items.
      // Expense module and Daily Ledger are kept completely separate per customer requirement.

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
      // Cash Sell = Closing Cash + Cash Outflows (Expenses + Investments) + Cash to Home - Opening Cash - Other Income
      const derivedCashSales =
        Number(ledgerObj.closingBalance || 0) +
        cashExpenseTotal +
        Number(ledgerObj.cashToHome || 0) -
        Number(ledgerObj.openingBalance || 0) -
        Number(ledgerObj.otherIncome || 0);

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

      // Compute Home Intake Summary for the month of ledger date & all-time
      try {
        let setting = null;
        try {
          setting = await HomeIntakeSetting.findOne();
        } catch (sErr) {
          console.error("Error loading HomeIntakeSetting in ledger:", sErr);
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
        console.error("Error computing home intake summary for ledger:", sumErr);
      }

      resolve(ledgerObj);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const saveLedger = (date, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      const {
        items = [],
        festival = "",
        notes = "",
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

      // Sanitize items: ensure no CC loan or credit card entries are persisted in DailyLedger.items
      const isCCExpenseItem = (item) => {
        const cat = String(item.category || "").toLowerCase().trim();
        const desc = String(item.description || "").toLowerCase().trim();
        const src = String(item.paymentSource || "").toLowerCase().trim();
        return (
          src === "cc_loan" ||
          src === "credit_card" ||
          cat === "cc_loan" ||
          cat === "cc_loan_repayment" ||
          cat === "credit_card_bill" ||
          desc.startsWith("cc loan:") ||
          desc.startsWith("cc loan -")
        );
      };
      const sanitizedItems = (items || []).filter((item) => !isCCExpenseItem(item));

      // Auto-sync items with type === "investment" into investments array
      let syncedInvestments = [];
      for (const item of sanitizedItems) {
        if (item.type === "investment" && item.description && Number(item.amount) > 0) {
          const itemDesc = item.description.trim();
          const itemAmt = Number(item.amount);
          let invType = "SIP";
          if (/fd|fixed deposit/i.test(itemDesc)) invType = "FD";
          else if (/mutual fund|mf/i.test(itemDesc)) invType = "Mutual Fund";
          else if (/sip/i.test(itemDesc)) invType = "SIP";
          else if (/gold/i.test(itemDesc)) invType = "Gold";
          else if (/ppf|lic/i.test(itemDesc)) invType = "PPF / LIC";
          else invType = "Other";

          syncedInvestments.push({
            name: itemDesc,
            amount: itemAmt,
            type: invType,
            notes: `From daily ledger (${item.paymentMode || "cash"})`,
          });
        }
      }

      for (const inv of investments || []) {
        if (inv.name && Number(inv.amount) > 0) {
          const alreadyExists = syncedInvestments.some(
            (s) => s.name?.toLowerCase().trim() === inv.name?.toLowerCase().trim() && Number(s.amount) === Number(inv.amount)
          );
          if (!alreadyExists) {
            syncedInvestments.push(inv);
          }
        }
      }

      // Auto-sync customer credits into CustomerCredit model and persist in DailyLedger.customerCredits
      let syncedCustomerCredits = [];
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

      // Compute derived sales to persist in MongoDB
      const cashExpenseTotal = sanitizedItems
        .filter((i) => (i.type === "expense" || i.type === "investment") && i.paymentMode !== "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bankExpenseTotal = sanitizedItems
        .filter((i) => (i.type === "expense" || i.type === "investment") && i.paymentMode === "bank")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const totalExpenses = sanitizedItems
        .filter((i) => i.type === "expense")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);

      const cashSales = Math.max(
        0,
        Number(closingBalance || 0) +
          cashExpenseTotal +
          Number(cashToHome || 0) -
          Number(openingBalance || 0) -
          Number(otherIncome || 0)
      );

      const digitalSales = Math.max(
        0,
        Number(closingBankBalance || 0) +
          bankExpenseTotal +
          Number(digitalToHome || 0) -
          Number(openingBankBalance || 0)
      );

      // Save as-is — closingBalance is the user's physical count, NOT computed
      const ledger = await DailyLedger.findOneAndUpdate(
        { date: targetDate },
        {
          date: targetDate,
          festival: festival || "",
          notes: notes || "",
          sweetProduction: sweetProduction || [],
          investments: syncedInvestments,
          customerCredits: syncedCustomerCredits,
          openingBalance: Number(openingBalance),
          openingBankBalance: Number(openingBankBalance),
          cashSales,
          digitalSales,
          otherIncome: Number(otherIncome),
          cashToHome: Number(cashToHome),
          digitalToHome: Number(digitalToHome),
          closingBalance: Number(closingBalance),
          closingBankBalance: Number(closingBankBalance),
          totalExpenses,
          items: sanitizedItems,
        },
        { upsert: true, new: true }
      );

      // --- AUTO SYNC NEXT DAY'S OPENING BALANCE ---
      try {
        const nextDayDateStr = dayjs(date).add(1, "day").format("YYYY-MM-DD");
        const nextDayDate = new Date(`${nextDayDateStr}T00:00:00.000Z`);
        const nextLedger = await DailyLedger.findOne({ date: nextDayDate });
        if (nextLedger) {
          nextLedger.openingBalance = Number(closingBalance || 0);
          nextLedger.openingBankBalance = Number(closingBankBalance || 0);
          const nItems = nextLedger.items || [];
          const nCashExpenses = nItems
            .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nBankExpenses = nItems
            .filter((i) => i.type === "expense" && i.paymentMode === "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nCashIncome = nItems
            .filter((i) => i.type === "income" && i.paymentMode !== "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const nBankIncome = nItems
            .filter((i) => i.type === "income" && i.paymentMode === "bank")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);

          nextLedger.cashSales = Math.max(
            0,
            Number(nextLedger.closingBalance || 0) +
              nCashExpenses +
              Number(nextLedger.cashToHome || 0) -
              Number(nextLedger.openingBalance || 0) -
              Number(nextLedger.otherIncome || 0) -
              nCashIncome
          );
          nextLedger.digitalSales = Math.max(
            0,
            Number(nextLedger.closingBankBalance || 0) +
              nBankExpenses +
              Number(nextLedger.digitalToHome || 0) -
              Number(nextLedger.openingBankBalance || 0) -
              nBankIncome
          );
          await nextLedger.save();
        }
      } catch (nextSyncErr) {
        console.error("Error auto-syncing next day opening balance:", nextSyncErr);
      }

      // --- AUTO SYNC CASH TO HOME & DIGITAL TO HOME (HOME INTAKE) ---
      try {
        const endOfDay = dayjs(date).endOf("day").toDate();

        // 1. Sync Cash to Home
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

        // 2. Sync Digital to Home
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
        console.error("Home intake sync error in ledgerController:", intakeErr);
      }

      // --- AUTO SYNC SAVED ITEMS TO VENDORS ONLY ---
      try {
        const savedItems = ledger.items || [];

        for (const item of savedItems) {
          if (item.type === "expense" && item.description && item.description.trim()) {
            const descName = item.description.trim();
            const itemAmount = Number(item.amount) || 0;
            const escapedName = descName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            let vendor = await Vendor.findOne({ name: new RegExp("^" + escapedName + "$", "i") });
            if (!vendor && descName) {
              vendor = new Vendor({
                name: descName,
                type: item.category === "supplier_payment" ? "flour" : "other",
                contact: "Auto-created from Ledger",
                address: "N/A",
                rate: 0,
              });
              await vendor.save();
            }

            if (vendor) {
              const existingTx = vendor.transactions.find((t) =>
                dayjs(t.date).isSame(targetDate, "day")
              );
              if (existingTx) {
                existingTx.amount = itemAmount;
                existingTx.paymentMethod = item.paymentMode === "bank" ? "bank" : "cash";
              } else {
                vendor.transactions.push({
                  date: targetDate,
                  quantity: 1,
                  amount: itemAmount,
                  paymentMethod: item.paymentMode === "bank" ? "bank" : "cash",
                });
              }
              vendor.lastPaymentDate = targetDate;
              await vendor.save();
            }
          }
        }
      } catch (syncErr) {
        console.error("Ledger save auto-sync error:", syncErr);
      }

      const ledgerResult = ledger.toObject ? ledger.toObject() : { ...ledger };
      try {
        let setting = null;
        try {
          setting = await HomeIntakeSetting.findOne();
        } catch (sErr) {
          console.error("Error loading HomeIntakeSetting in saveLedger:", sErr);
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

        ledgerResult.homeIntakeSummary = {
          ...computeHomeIntakeSummary(monthExpenses, setting, date),
          periodName: dayjs(date).format("MMMM YYYY"),
        };
        ledgerResult.allTimeHomeIntakeSummary = {
          ...computeHomeIntakeSummary(allExpenses, setting, null),
          periodName: `All-Time (from ${effectiveCutoff.format("DD MMM YYYY")})`,
        };
      } catch (sumErr) {
        console.error("Error computing home intake summary on save:", sumErr);
      }

      resolve(ledgerResult);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getLedgerByDate, saveLedger };

