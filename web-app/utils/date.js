import dayjs from "dayjs";

export const formatDate = (date, formatStr = "DD MMM YYYY") => {
  if (!date) return "";
  return dayjs(date).format(formatStr);
};

export const startOfDay = (date) => dayjs(date).startOf("day").toDate();
export const endOfDay = (date) => dayjs(date).endOf("day").toDate();
