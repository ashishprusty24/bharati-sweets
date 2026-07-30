import connectDB from "../database/mongodb";
import MarketingTemplate from "../models/MarketingTemplate";
import MarketingCampaign from "../models/MarketingCampaign";

const DEFAULT_TEMPLATES = [
  {
    category: "Festival",
    title: "Festival Greetings",
    content:
      "🎉 *Bharati Sweets* wishes you a joyful celebration!\n\nIndulge in our handcrafted sweets this festive season. 🍬 Fresh. Traditional. Delicious.\n\n📍 Visit us or call to place your order. We also do custom gift boxes!\n\n✨ *Bharati Sweets – Where every bite tells a story.*",
    platforms: ["whatsapp", "instagram"],
  },
  {
    category: "Event",
    title: "Wedding & Bulk Orders",
    content:
      '💍 Planning a wedding or special event?\n\nTrust *Bharati Sweets* for premium bulk orders with custom packaging.\n\n✅ Freshly made on order\n✅ Attractive gift wrapping\n✅ Deliveries across the city\n\nContact us now to book! 📞',
    platforms: ["whatsapp", "facebook"],
  },
];

export class MarketingRepository {
  static async findTemplates() {
    await connectDB();
    let templates = await MarketingTemplate.find({ isActive: true }).sort({ createdAt: -1 });
    if (templates.length === 0) {
      await MarketingTemplate.insertMany(DEFAULT_TEMPLATES);
      templates = await MarketingTemplate.find({ isActive: true }).sort({ createdAt: -1 });
    }
    return templates;
  }

  static async createTemplate(data) {
    await connectDB();
    const template = new MarketingTemplate(data);
    return await template.save();
  }

  static async findCampaigns() {
    await connectDB();
    return await MarketingCampaign.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("templateId", "title category");
  }

  static async createCampaign(data) {
    await connectDB();
    const campaign = new MarketingCampaign(data);
    return await campaign.save();
  }
}
