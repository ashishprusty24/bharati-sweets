import { getSummaryHandler } from "../../../../controllers/accounting.controller";

export async function GET(request) {
  return getSummaryHandler(request);
}
