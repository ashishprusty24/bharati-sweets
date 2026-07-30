import { StaffController } from "../../../controllers/staff.controller";

export async function GET(req, ctx) {
  return StaffController.getStaff(req, ctx);
}

export async function POST(req, ctx) {
  return StaffController.createStaff(req, ctx);
}
