import { NextResponse } from "next/server";
import { CreditCardService } from "../services/creditCard.service";

export class CreditCardController {
  static async getAllCards(req) {
    try {
      const cards = await CreditCardService.getAllCards();
      return NextResponse.json(cards);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createCard(req) {
    try {
      const body = await req.json();
      const newCard = await CreditCardService.createCard(body);
      return NextResponse.json(newCard, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async getSummary(req) {
    try {
      const summary = await CreditCardService.getCardSummary();
      return NextResponse.json(summary);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async addTransaction(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updatedCard = await CreditCardService.addTransaction(id, body);
      return NextResponse.json(updatedCard, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteTransaction(req, { params }) {
    try {
      const { id, txnId } = await params;
      const updatedCard = await CreditCardService.deleteTransaction(id, txnId);
      return NextResponse.json(updatedCard);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async addBillPayment(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updatedCard = await CreditCardService.addBillPayment(id, body);
      return NextResponse.json(updatedCard, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateCard(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const card = await CreditCardService.updateCard(id, body);
      return NextResponse.json(card);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteCard(req, { params }) {
    try {
      const { id } = await params;
      const result = await CreditCardService.deleteCard(id);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
