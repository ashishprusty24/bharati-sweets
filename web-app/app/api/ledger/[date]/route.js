import { LedgerController } from "../../../../controllers/ledger.controller";

export async function GET(req, ctx) {
  return LedgerController.getLedgerByDate(req, ctx);
}

export async function POST(req, ctx) {
  return LedgerController.saveLedger(req, ctx);
}
