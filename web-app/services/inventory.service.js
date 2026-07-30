import { InventoryRepository } from "../repositories/inventory.repository";

export class InventoryService {
  static async getItems() {
    return await InventoryRepository.findAll();
  }

  static async createItem(data) {
    return await InventoryRepository.create(data);
  }

  static async updateItem(id, data) {
    return await InventoryRepository.update(id, data);
  }

  static async deleteItem(id) {
    return await InventoryRepository.delete(id);
  }
}
