import { VendorController } from "../../../controllers/vendor.controller";

export async function GET(req, ctx) {
  return VendorController.getVendors(req, ctx);
}

export async function POST(req, ctx) {
  return VendorController.createVendor(req, ctx);
}
