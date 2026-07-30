import { VendorRepository } from "../repositories/vendor.repository";

export class VendorService {
  static async getVendors() {
    return await VendorRepository.findAll();
  }

  static async createVendor(data) {
    return await VendorRepository.create(data);
  }

  static async updateVendor(id, data) {
    return await VendorRepository.update(id, data);
  }

  static async deleteVendor(id) {
    return await VendorRepository.delete(id);
  }
}
