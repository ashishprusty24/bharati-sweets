import { NextResponse } from "next/server";
import { FestivalService } from "../../../../../services/festival.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const festival = searchParams.get("festival") || "";

    const analytics = await FestivalService.getFestivalAnalytics(festival);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error in GET /api/festivals/analytics:", error);
    return NextResponse.json({ error: "Failed to fetch festival analytics" }, { status: 500 });
  }
}
