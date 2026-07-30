import { CreditCardController } from "../../../../../../controllers/creditCard.controller";

export async function DELETE(req, ctx) {
  return CreditCardController.deleteTransaction(req, ctx);
}
