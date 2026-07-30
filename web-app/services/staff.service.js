import { StaffRepository } from "../repositories/staff.repository";

export class StaffService {
  static async getStaff() {
    return await StaffRepository.findAll();
  }

  static async createStaff(data) {
    return await StaffRepository.create(data);
  }

  static async updateStaff(id, data) {
    return await StaffRepository.update(id, data);
  }

  static async deleteStaff(id) {
    return await StaffRepository.delete(id);
  }
}
