import { NextResponse } from "next/server";
import { CustomerService } from "../services/customer.service";

export class CustomerController {
  static async getCustomers(req) {
    try {
      const customers = await CustomerService.getCustomers();
      return NextResponse.json(customers);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
