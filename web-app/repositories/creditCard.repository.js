import connectDB from "../database/mongodb";
import CreditCard from "../models/CreditCard";

export class CreditCardRepository {
  static async findAll() {
    await connectDB();
    return await CreditCard.find();
  }

  static async findById(id) {
    await connectDB();
    return await CreditCard.findById(id);
  }

  static async create(cardData) {
    await connectDB();
    const card = new CreditCard(cardData);
    return await card.save();
  }

  static async update(id, updateData) {
    await connectDB();
    return await CreditCard.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  static async delete(id) {
    await connectDB();
    return await CreditCard.findByIdAndDelete(id);
  }

  static async saveCard(cardDocument) {
    await connectDB();
    return await cardDocument.save();
  }
}
