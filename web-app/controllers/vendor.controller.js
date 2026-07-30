import { NextResponse } from "next/server";
import { VendorService } from "../services/vendor.service";

export class VendorController {
  static async getVendors(req) {
    try {
      const vendors = await VendorService.getVendors();
      return NextResponse.json(vendors);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createVendor(req) {
    try {
      const body = await req.json();
      const newVendor = await VendorService.createVendor(body);
      return NextResponse.json(newVendor, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateVendor(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await VendorService.updateVendor(id, body);
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteVendor(req, { params }) {
    try {
      const { id } = await params;
      const result = await VendorService.deleteVendor(id);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
