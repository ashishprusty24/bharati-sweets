import { CreditCardRepository } from "../repositories/creditCard.repository";

export class CreditCardService {
  static async getAllCards() {
    return await CreditCardRepository.findAll();
  }

  static async getCardById(id) {
    const card = await CreditCardRepository.findById(id);
    if (!card) throw new Error("Credit Card not found");
    return card;
  }

  static async createCard(data) {
    return await CreditCardRepository.create(data);
  }

  static async updateCard(id, data) {
    return await CreditCardRepository.update(id, data);
  }

  static async deleteCard(id) {
    return await CreditCardRepository.delete(id);
  }

  static async addTransaction(cardId, txnData) {
    const card = await CreditCardRepository.findById(cardId);
    if (!card) throw new Error("Credit Card not found");

    card.transactions.push(txnData);
    return await CreditCardRepository.saveCard(card);
  }

  static async deleteTransaction(cardId, txnId) {
    const card = await CreditCardRepository.findById(cardId);
    if (!card) throw new Error("Credit Card not found");

    card.transactions.id(txnId).deleteOne();
    return await CreditCardRepository.saveCard(card);
  }

  static async addBillPayment(cardId, paymentData) {
    const card = await CreditCardRepository.findById(cardId);
    if (!card) throw new Error("Credit Card not found");

    card.billPayments.push(paymentData);

    let remaining = paymentData.amount;
    for (const txn of card.transactions) {
      if (!txn.isSettled && remaining > 0) {
        if (remaining >= txn.amount) {
          txn.isSettled = true;
          remaining -= txn.amount;
        } else {
          break;
        }
      }
    }

    return await CreditCardRepository.saveCard(card);
  }

  static async getCardSummary() {
    const cards = await CreditCardRepository.findAll();
    const summary = cards.map((card) => ({
      _id: card._id,
      cardName: card.cardName,
      last4Digits: card.last4Digits,
      cardType: card.cardType,
      creditLimit: card.creditLimit,
      currentOutstanding: card.currentOutstanding,
      totalTransactions: card.transactions.length,
      unsettledCount: card.transactions.filter((t) => !t.isSettled).length,
      totalBillPayments: card.billPayments.reduce((s, p) => s + (p.amount || 0), 0),
    }));

    const totalOutstanding = summary.reduce((s, c) => s + c.currentOutstanding, 0);
    return { cards: summary, totalOutstanding };
  }
}
