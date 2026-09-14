import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import EventOrder from "../../../../models/EventOrder";
import Inventory from "../../../../models/Inventory";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let query = {};
    if (startDateParam && startDateParam !== "all" && startDateParam !== "2000-01-01") {
      const start = new Date(`${startDateParam}T00:00:00.000Z`);
      const end = endDateParam
        ? new Date(`${endDateParam}T23:59:59.999Z`)
        : new Date(`${startDateParam}T23:59:59.999Z`);

      query = {
        $or: [
          { deliveryDate: { $gte: start, $lte: end } },
          { eventDate: { $gte: start, $lte: end } },
        ],
      };
    }

    const [orders, allInventory] = await Promise.all([
      EventOrder.find(query),
      Inventory.find({}),
    ]);

    if (!orders || orders.length === 0) return NextResponse.json([]);

    let totalPackets = 0;
    let activeOrderCount = 0;
    const itemTotals = {};

    orders.forEach((order) => {
      if (order.orderStatus === "cancelled" || order.status === "cancelled") return;
      activeOrderCount++;
      const pkts = Number(order.packets) || 1;
      totalPackets += pkts;
      (order.items || []).forEach((item) => {
        const key = (item.name || item.itemName || "").trim();
        if (!key) return;
        if (!itemTotals[key]) {
          itemTotals[key] = {
            name: key,
            itemId: item.itemId || item._id,
            quantity: 0,
            unit: item.unit || "pcs",
          };
        }
        const itemQty = Number(item.quantity) || Number(item.qty) || 0;
        itemTotals[key].quantity += itemQty * pkts;
      });
    });

    if (activeOrderCount === 0) return NextResponse.json([]);

    let totalStockQty = 0;
    let totalNetPrepQty = 0;
    let totalItemsShortage = 0;

    const itemsList = Object.values(itemTotals).map((item) => {
      const invItem = allInventory.find(
        (inv) =>
          (item.itemId && inv._id.toString() === item.itemId.toString()) ||
          inv.name.trim().toLowerCase() === item.name.toLowerCase()
      );

      const currentStock = invItem ? Number(invItem.quantity) || 0 : 0;
      const unit = invItem ? invItem.unit || item.unit || "pcs" : item.unit || "pcs";
      const kitchenSection = invItem ? invItem.kitchenSection || "Uncategorized" : "Uncategorized";
      const toPrepare = Math.max(0, item.quantity - currentStock);
      const stockStatus = currentStock >= item.quantity ? "In Stock" : "Preparation Required";

      totalStockQty += currentStock;
      totalNetPrepQty += toPrepare;
      if (toPrepare > 0) totalItemsShortage++;

      return {
        ...item,
        unit,
        kitchenSection,
        currentStock,
        toPrepare,
        stockStatus,
      };
    });

    itemsList.sort((a, b) => b.toPrepare - a.toPrepare || b.quantity - a.quantity);

    return NextResponse.json([
      {
        deliveryDate: orders[0]?.deliveryDate || new Date(),
        packets: totalPackets,
        items: itemsList,
        totalOrders: activeOrderCount,
        totalStockQty,
        totalNetPrepQty,
        totalItemsShortage,
      },
    ]);
  } catch (err) {
    console.error("❌ Next.js Prep Report error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
