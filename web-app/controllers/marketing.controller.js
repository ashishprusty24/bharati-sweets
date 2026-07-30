import { NextResponse } from "next/server";
import { MarketingService } from "../services/marketing.service";

export class MarketingController {
  static async getTemplates(req) {
    try {
      const templates = await MarketingService.getTemplates();
      return NextResponse.json(templates);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createTemplate(req) {
    try {
      const body = await req.json();
      const template = await MarketingService.createTemplate(body);
      return NextResponse.json(template, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async getCampaigns(req) {
    try {
      const campaigns = await MarketingService.getCampaigns();
      return NextResponse.json(campaigns);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createCampaign(req) {
    try {
      const body = await req.json();
      const campaign = await MarketingService.createCampaign(body);
      return NextResponse.json(campaign, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }
}
