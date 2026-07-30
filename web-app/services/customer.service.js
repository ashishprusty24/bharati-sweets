import { CustomerRepository } from "../repositories/customer.repository";

export class CustomerService {
  static async getCustomers() {
    const { eventCustomers, regularCustomers } = await CustomerRepository.getAggregatedCustomers();
    const mergedMap = {};

    [...eventCustomers, ...regularCustomers].forEach((c) => {
      if (!c.phone) return;
      const key = c.phone;
      if (!mergedMap[key]) {
        mergedMap[key] = {
          phone: c.phone,
          customerName: c.customerName,
          lastOrderDate: c.lastOrderDate,
          orderCount: c.orderCount,
          totalSpent: c.totalSpent,
        };
      } else {
        mergedMap[key].orderCount += c.orderCount;
        mergedMap[key].totalSpent += c.totalSpent;
        if (new Date(c.lastOrderDate) > new Date(mergedMap[key].lastOrderDate)) {
          mergedMap[key].lastOrderDate = c.lastOrderDate;
          mergedMap[key].customerName = c.customerName;
        }
      }
    });

    return Object.values(mergedMap).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  }
}
