import { MarketingController } from "../../../../controllers/marketing.controller";

export async function GET(req, ctx) {
  return MarketingController.getTemplates(req, ctx);
}

export async function POST(req, ctx) {
  return MarketingController.createTemplate(req, ctx);
}
