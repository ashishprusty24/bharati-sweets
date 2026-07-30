import { OrderRepository } from "../repositories/order.repository";

export class OrderService {
  static async getRegularOrders(query = {}) {
    return await OrderRepository.findRegularOrders(query);
  }

  static async createRegularOrder(data) {
    return await OrderRepository.createRegularOrder(data);
  }

  static async getEventOrders(query = {}) {
    return await OrderRepository.findEventOrders(query);
  }

  static async createEventOrder(data) {
    return await OrderRepository.createEventOrder(data);
  }

  static async updateEventOrder(id, data) {
    return await OrderRepository.updateEventOrder(id, data);
  }
}
