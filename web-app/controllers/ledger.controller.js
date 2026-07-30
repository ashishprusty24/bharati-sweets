import { NextResponse } from "next/server";
import { LedgerService } from "../services/ledger.service";

export class LedgerController {
  static async getLedgerByDate(req, { params }) {
    try {
      const { date } = await params;
      const ledger = await LedgerService.getLedgerByDate(date);
      return NextResponse.json(ledger);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async saveLedger(req, { params }) {
    try {
      const { date } = await params;
      const body = await req.json();
      const ledger = await LedgerService.saveLedger(date, body);
      return NextResponse.json(ledger);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }
}
