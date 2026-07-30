import connectDB from "../database/mongodb";
import Vendor from "../models/Vendor";

export class VendorRepository {
  static async findAll() {
    await connectDB();
    return await Vendor.find().sort({ name: 1 });
  }

  static async create(data) {
    await connectDB();
    const vendor = new Vendor(data);
    return await vendor.save();
  }

  static async update(id, data) {
    await connectDB();
    return await Vendor.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    await connectDB();
    return await Vendor.findByIdAndDelete(id);
  }
}
