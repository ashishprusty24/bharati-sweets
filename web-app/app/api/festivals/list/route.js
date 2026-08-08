import { NextResponse } from "next/server";
import { FestivalService } from "../../../../../services/festival.service";

export async function GET() {
  try {
    const list = await FestivalService.getFestivalList();
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error in GET /api/festivals/list:", error);
    return NextResponse.json({ error: "Failed to fetch festival list" }, { status: 500 });
  }
}
