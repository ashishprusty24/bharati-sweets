import { MarketingController } from "../../../../controllers/marketing.controller";

export async function GET(req, ctx) {
  return MarketingController.getCampaigns(req, ctx);
}

export async function POST(req, ctx) {
  return MarketingController.createCampaign(req, ctx);
}
