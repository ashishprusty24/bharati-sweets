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
        if (item.type === "expense" && item.amount > 0 && item.description) {
          const desc = item.description.toLowerCase();
          
          // Save in Expense model
          await Expense.create({
            date: new Date(targetDate),
            amount: item.amount,
            category: desc.includes("milk") || desc.includes("chenna") || desc.includes("veg") ? "ingredients" : "other",
            description: item.description,
            paymentMode: item.paymentMode || "cash",
          }).catch(() => {});

          // Check if matches any vendor name
          const matchedVendor = allVendors.find(v => 
            v.name && (desc.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(desc))
          );

          if (matchedVendor) {
            await Vendor.findByIdAndUpdate(matchedVendor._id, {
              $inc: { outstandingBalance: -item.amount }
            });
          }
        }
      }
    }

    return ledger;
  }
}
