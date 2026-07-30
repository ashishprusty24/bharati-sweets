import { MarketingRepository } from "../repositories/marketing.repository";

export class MarketingService {
  static async getTemplates() {
    return await MarketingRepository.findTemplates();
  }

  static async createTemplate(data) {
    return await MarketingRepository.createTemplate(data);
  }

  static async getCampaigns() {
    return await MarketingRepository.findCampaigns();
  }

  static async createCampaign(data) {
    return await MarketingRepository.createCampaign(data);
  }
}
