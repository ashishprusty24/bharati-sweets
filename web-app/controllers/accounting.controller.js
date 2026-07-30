import * as accountingService from "../services/accounting.service";

export const getSummaryHandler = async (req) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 86400000).toISOString();
  const endDate = searchParams.get("endDate") || new Date().toISOString();

  const data = await accountingService.getFinancialSummary(startDate, endDate);
  return Response.json(data);
};

export const getTransactionsHandler = async (req) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 86400000).toISOString();
  const endDate = searchParams.get("endDate") || new Date().toISOString();

  const data = await accountingService.getTransactions(startDate, endDate);
  return Response.json(data);
};
