const express = require("express");
const router = express.Router();
const EventOrder = require("../models/EventOrder");
const RegularOrder = require("../models/RegularOrder");

// GET /api/customers — unique customers deduplicated by phone number, sorted by most recent
router.get("/", async (req, res) => {
  try {
    const eventCustomers = await EventOrder.aggregate([
      {
        $group: {
          _id: "$phone",
          customerName: { $last: "$customerName" },
          phone: { $last: "$phone" },
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          source: { $last: { $literal: "event" } },
        },
      },
    ]);

    const regularCustomers = await RegularOrder.aggregate([
      {
        $group: {
          _id: "$phone",
          customerName: { $last: "$customerName" },
          phone: { $last: "$phone" },
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$payment.amount" },
          source: { $last: { $literal: "regular" } },
        },
      },
    ]);

    // Merge — phone is the unique key
    const mergedMap = {};
    const eventPhones = new Set(eventCustomers.map((c) => c.phone));
    const bigEventPhones = new Set(
      eventCustomers.filter((c) => c.totalSpent > 10000).map((c) => c.phone)
    );

    [...eventCustomers, ...regularCustomers].forEach((c) => {
      const key = c.phone;
      if (!mergedMap[key]) {
        mergedMap[key] = {
          phone: c.phone,
          customerName: c.customerName,
          lastOrderDate: c.lastOrderDate,
          orderCount: c.orderCount,
          totalSpent: c.totalSpent,
        };
      } else {
        mergedMap[key].orderCount += c.orderCount;
        mergedMap[key].totalSpent += c.totalSpent;
        if (new Date(c.lastOrderDate) > new Date(mergedMap[key].lastOrderDate)) {
          mergedMap[key].lastOrderDate = c.lastOrderDate;
          mergedMap[key].customerName = c.customerName;
        }
      }
    });

    // Compute segments and tags
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const customers = Object.values(mergedMap)
      .map((c) => {
        const tags = [];
        let segment = "Regular";

        if (c.totalSpent > 50000 || c.orderCount > 20) {
          segment = "VIP";
          tags.push("VIP");
        } else if (c.orderCount > 5) {
          segment = "Frequent";
          tags.push("Frequent Buyer");
        }

        if (bigEventPhones.has(c.phone)) {
          if (segment === "Regular") segment = "Wholesale";
          tags.push("Wholesale");
        }

        if (c.lastOrderDate && new Date(c.lastOrderDate) < ninetyDaysAgo) {
          if (segment === "Regular") segment = "Inactive";
          tags.push("Inactive");
        }

        return { ...c, segment, tags };
      })
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
