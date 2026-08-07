import connectDB from "../database/mongodb";
import DailyLedger from "../models/DailyLedger";
import Vendor from "../models/Vendor";
import Expense from "../models/Expense";

export class LedgerRepository {
  static async findByDate(targetDate) {
    await connectDB();
    return await DailyLedger.findOne({ date: targetDate });
  }

  static async findPreviousDayLedger(prevDate) {
    await connectDB();
    return await DailyLedger.findOne({ date: prevDate });
  }

  static async saveOrUpdateLedger(targetDate, payload) {
    await connectDB();
    const ledger = await DailyLedger.findOneAndUpdate(
      { date: targetDate },
      { ...payload, date: targetDate },
      { upsert: true, new: true }
    );

    // Vendor and Expense sync
    if (payload.items && Array.isArray(payload.items)) {
      const allVendors = await Vendor.find().lean();
      
      for (const item of payload.items) {
        if (item.type === "expense" && item.amount > 0 && item.description && item.description.trim()) {
          const desc = item.description.trim();
          const descLower = desc.toLowerCase();
          const itemAmount = Number(item.amount) || 0;
          
          // Match existing expense by date and description
          const startOfDay = new Date(targetDate);
          startOfDay.setHours(0,0,0,0);
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23,59,59,999);

          const existingExp = await Expense.findOne({
            date: { $gte: startOfDay, $lte: endOfDay },
            description: new RegExp("^" + desc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i"),
          });

          const cat = descLower.includes("milk") || descLower.includes("chenna") || descLower.includes("veg") ? "ingredients" : "other";

          if (existingExp) {
            existingExp.amount = itemAmount;
            existingExp.category = cat;
            existingExp.paymentMode = item.paymentMode || "cash";
            await existingExp.save();
          } else {
            await Expense.create({
              date: new Date(targetDate),
              amount: itemAmount,
              category: cat,
              description: desc,
              paymentMode: item.paymentMode || "cash",
            }).catch(() => {});
          }

          // Check if matches any vendor name
          const matchedVendor = allVendors.find(v => 
            v.name && (descLower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(descLower))
          );

          if (matchedVendor) {
            await Vendor.findByIdAndUpdate(matchedVendor._id, {
              $set: { lastPaymentDate: new Date(targetDate) }
            });
          }
        }
      }
    }

    return ledger;
  }
}
