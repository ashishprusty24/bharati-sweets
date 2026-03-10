const MarketingTemplate = require("../models/MarketingTemplate");
const MarketingCampaign = require("../models/MarketingCampaign");
const EventOrder = require("../models/EventOrder");
const RegularOrder = require("../models/RegularOrder");

// Default templates to seed
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
  {
    category: "Promotion",
    title: "New Product Launch",
    content:
      "🌟 *New Arrival at Bharati Sweets!*\n\nWe're excited to introduce our latest creation — made with the finest ingredients and traditional recipes.\n\nBe the first to taste it! Visit us today or order now.\n\n🏠 *Bharati Sweets* – Taste the tradition.",
    platforms: ["whatsapp", "instagram", "facebook"],
  },
  {
    category: "Seasonal",
    title: "Summer Special Offer",
    content:
      "☀️ *Summer Special at Bharati Sweets!*\n\nBeating the heat with something sweet! Exclusive discounts on selected items this week.\n\n🎁 Limited time offer. Visit us soon!\n\n📞 Call us to pre-order your favourites.",
    platforms: ["whatsapp", "facebook"],
  },
];

// GET /marketing/templates
exports.getTemplates = async (req, res) => {
  try {
    let templates = await MarketingTemplate.find({ isActive: true }).sort({
      createdAt: -1,
    });

    // Auto-seed if empty
    if (templates.length === 0) {
      await MarketingTemplate.insertMany(DEFAULT_TEMPLATES);
      templates = await MarketingTemplate.find({ isActive: true }).sort({
        createdAt: -1,
      });
    }

    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /marketing/stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Campaign stats this month
    const campaignStats = await MarketingCampaign.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$analytics.sent" },
          totalDelivered: { $sum: "$analytics.delivered" },
          totalClicked: { $sum: "$analytics.clicked" },
          totalRevenue: { $sum: "$analytics.revenue" },
          campaignCount: { $sum: 1 },
        },
      },
    ]);

    // Total unique customers (contacts)
    const eventCustomerCount = await EventOrder.distinct("phone");
    const regularCustomerCount = await RegularOrder.distinct("phone");
    const allPhones = new Set([...eventCustomerCount, ...regularCustomerCount]);
    const totalContacts = allPhones.size;

    // Customers added this month
    const newEventCustomers = await EventOrder.distinct("phone", {
      createdAt: { $gte: startOfMonth },
    });
    const newRegularCustomers = await RegularOrder.distinct("phone", {
      createdAt: { $gte: startOfMonth },
    });
    const newContacts = new Set([
      ...newEventCustomers,
      ...newRegularCustomers,
    ]).size;

    const stats = campaignStats[0] || {};

    res.json({
      messagesSent: stats.totalSent || 0,
      totalContacts,
      openRate: stats.totalSent
        ? Math.round((stats.totalDelivered / stats.totalSent) * 100)
        : 0,
      newContacts,
      totalRevenue: stats.totalRevenue || 0,
      campaignCount: stats.campaignCount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /marketing/campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("templateId", "title category");
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /marketing/campaigns
exports.createCampaign = async (req, res) => {
  try {
    const { title, platform, templateId, message, recipients, scheduledAt } =
      req.body;

    if (!title || !platform) {
      return res
        .status(400)
        .json({ message: "Title and platform are required." });
    }

    const campaign = new MarketingCampaign({
      title,
      platform,
      templateId: templateId || null,
      message: message || "",
      recipients: recipients || [],
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? "scheduled" : "draft",
      analytics: {
        sent: recipients ? recipients.length : 0,
        delivered: 0,
        clicked: 0,
        ordersGenerated: 0,
        revenue: 0,
      },
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /marketing/templates
exports.createTemplate = async (req, res) => {
  try {
    const { title, category, content, platforms } = req.body;
    if (!title || !category || !content) {
      return res
        .status(400)
        .json({ message: "Title, category, and content are required." });
    }

    const template = new MarketingTemplate({
      title,
      category,
      content,
      platforms: platforms || ["whatsapp"],
    });

    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
