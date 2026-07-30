import { CreditCardController } from "../../../../../controllers/creditCard.controller";

export async function POST(req, ctx) {
  return CreditCardController.addBillPayment(req, ctx);
}
