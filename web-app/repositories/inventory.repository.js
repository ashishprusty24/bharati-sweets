import connectDB from "../database/mongodb";
import Inventory from "../models/Inventory";

export class InventoryRepository {
  static async findAll() {
    await connectDB();
    return await Inventory.find().sort({ name: 1 });
  }

  static async create(data) {
    await connectDB();
    const item = new Inventory(data);
    return await item.save();
  }

  static async update(id, data) {
    await connectDB();
    return await Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    await connectDB();
    return await Inventory.findByIdAndDelete(id);
  }
}
