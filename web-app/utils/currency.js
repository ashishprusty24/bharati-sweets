export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN");
};

export const formatRupee = (amount) => {
  return `₹${formatCurrency(amount)}`;
};
