const DailyLedger = require("../models/DailyLedger");
const dayjs = require("dayjs");

const FESTIVALS_PRESETS = [
  "Rakhi Purnima",
  "Diwali",
  "Dussehra / Vijaya Dashami",
  "Durga Puja",
  "Chhath Puja",
  "Holi",
  "Christmas",
  "New Year",
  "Eid",
  "Ganesh Chaturthi",
  "Janmashtami",
  "Onam",
  "Raja Sankranti",
  "Nuakhai",
  "Kumar Purnima",
  "Kartik Purnima",
  "Makar Sankranti",
];

/**
 * GET /api/festivals — List all unique tagged festivals + presets
 */
const getFestivalList = async () => {
  try {
    const tagged = await DailyLedger.distinct("festival");
    const validTagged = (tagged || []).filter((f) => f && f.trim().length > 0);
    const combined = Array.from(new Set([...FESTIVALS_PRESETS, ...validTagged]));
    return combined.map((f) => ({ value: f }));
  } catch (err) {
    console.error("Error fetching festival list:", err);
    return FESTIVALS_PRESETS.map((f) => ({ value: f }));
  }
};

/**
 * GET /api/festival-analytics?festival=Rakhi%20Purnima
 * Aggregates YoY sales and sweet production logs for a given festival name across all years.
 */
const getFestivalAnalytics = async (festivalName) => {
  if (!festivalName || !festivalName.trim()) {
    return { festival: "", years: [], sweetAnalytics: [] };
  }

  const queryTag = festivalName.trim();
  const escaped = queryTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Search ledgers tagged with this festival (case-insensitive)
  const ledgers = await DailyLedger.find({
    festival: new RegExp("^" + escaped + "$", "i"),
  }).sort({ date: 1 });

  // Map each year's performance
  const years = ledgers.map((ledger) => {
    const items = ledger.items || [];
    const cashExp = items
      .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankExp = items
      .filter((i) => i.type === "expense" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const cashInc = items
      .filter((i) => i.type === "income" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankInc = items
      .filter((i) => i.type === "income" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalExp = cashExp + bankExp;

    const cashSales = Math.max(
      0,
      Number(ledger.closingBalance || 0) +
        cashExp +
        Number(ledger.cashToHome || 0) -
        Number(ledger.openingBalance || 0) -
        Number(ledger.otherIncome || 0) -
        cashInc
    );

    const digitalSales = Math.max(
      0,
      Number(ledger.closingBankBalance || 0) +
        bankExp +
        Number(ledger.digitalToHome || 0) -
        Number(ledger.openingBankBalance || 0) -
        bankInc
    );

    const totalSales = ledger.cashSales && ledger.digitalSales
      ? ledger.cashSales + ledger.digitalSales
      : cashSales + digitalSales;

    return {
      date: ledger.date,
      year: dayjs(ledger.date).format("YYYY"),
      dateFormatted: dayjs(ledger.date).format("DD MMM YYYY (dddd)"),
      cashSales: ledger.cashSales || cashSales,
      digitalSales: ledger.digitalSales || digitalSales,
      totalSales,
      totalExpenses: totalExp,
      sweetProduction: ledger.sweetProduction || [],
    };
  });

  // Group sweet production by sweet name across years for comparison
  const sweetMap = {};

  years.forEach((yr) => {
    (yr.sweetProduction || []).forEach((sp) => {
      const name = (sp.sweetName || "Unknown Sweet").trim();
      if (!sweetMap[name]) {
        sweetMap[name] = [];
      }

      const made = Number(sp.quantity) || 0;
      const sold = Number(sp.actualSold) || 0;
      const diff = made - sold; // positive = stock remaining (surplus), 0 = 100% sold out

      let status = "matched";
      let recommendation = `✅ Production matched demand in ${yr.year}`;

      if (sold > 0) {
        if (made > sold) {
          status = "surplus";
          const surplus = made - sold;
          recommendation = `📦 ${surplus} ${sp.unit || "ghan"} surplus stock remained in ${yr.year}. Consider reducing production to ~${sold} ${sp.unit || "ghan"}`;
        } else {
          status = "shortage";
          recommendation = `⚠️ All ${made} ${sp.unit || "ghan"} sold out in ${yr.year}! Consider increasing by 10-20% for next year`;
        }
      }

      sweetMap[name].push({
        year: yr.year,
        dateFormatted: yr.dateFormatted,
        sweetName: name,
        quantity: made,
        unit: sp.unit || "ghan",
        actualSold: sold,
        diff,
        status,
        notes: sp.notes || "",
        recommendation,
      });
    });

  });

  const sweetAnalytics = Object.entries(sweetMap).map(([sweetName, history]) => {
    // Sort history by year
    history.sort((a, b) => a.year.localeCompare(b.year));
    const latest = history[history.length - 1];

    return {
      sweetName,
      unit: latest ? latest.unit : "ghan",
      history,
      latestRecommendation: latest ? latest.recommendation : "Maintain current quantity",
    };
  });

  return {
    festival: queryTag,
    totalOccurrences: years.length,
    years,
    sweetAnalytics,
  };
};

module.exports = {
  getFestivalList,
  getFestivalAnalytics,
};
