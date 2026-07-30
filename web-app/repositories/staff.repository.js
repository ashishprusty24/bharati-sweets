import connectDB from "../database/mongodb";
import Staff from "../models/Staff";

export class StaffRepository {
  static async findAll() {
    await connectDB();
    return await Staff.find().sort({ name: 1 });
  }

  static async create(data) {
    await connectDB();
    const staff = new Staff(data);
    return await staff.save();
  }

  static async update(id, data) {
    await connectDB();
    return await Staff.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    await connectDB();
    return await Staff.findByIdAndDelete(id);
  }
}
