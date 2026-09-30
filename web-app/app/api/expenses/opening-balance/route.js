import { NextResponse } from "next/server";
import { ExpenseService } from "../../../../services/expense.service";

export async function GET() {
  try {
    const setting = await ExpenseService.getHomeIntakeSetting();
    return NextResponse.json(setting);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const setting = await ExpenseService.saveHomeIntakeSetting(body);
    return NextResponse.json(setting);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const setting = await ExpenseService.saveHomeIntakeSetting(body);
    return NextResponse.json(setting);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
