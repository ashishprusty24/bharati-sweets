import * as accountingRepository from "../repositories/accounting.repository";

export const getFinancialSummary = async (startDate, endDate) => {
  return await accountingRepository.getFinancialSummary(startDate, endDate);
};

export const getTransactions = async (startDate, endDate) => {
  return await accountingRepository.getTransactions(startDate, endDate);
};
