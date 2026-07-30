import { CreditCardController } from "../../../../controllers/creditCard.controller";

export async function GET(req, ctx) {
  return CreditCardController.getSummary(req, ctx);
}
