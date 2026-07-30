import { CreditCardController } from "../../../controllers/creditCard.controller";

export async function GET(req, ctx) {
  return CreditCardController.getAllCards(req, ctx);
}

export async function POST(req, ctx) {
  return CreditCardController.createCard(req, ctx);
}
