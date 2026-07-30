import { CustomerController } from "../../../controllers/customer.controller";

export async function GET(req, ctx) {
  return CustomerController.getCustomers(req, ctx);
}
