import { getTransactionsHandler } from "../../../../controllers/accounting.controller";

export async function GET(request) {
  return getTransactionsHandler(request);
}
