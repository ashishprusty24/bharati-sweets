import { NextResponse } from "next/server";
import { StaffService } from "../services/staff.service";

export class StaffController {
  static async getStaff(req) {
    try {
      const staff = await StaffService.getStaff();
      return NextResponse.json(staff);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }

  static async createStaff(req) {
    try {
      const body = await req.json();
      const newStaff = await StaffService.createStaff(body);
      return NextResponse.json(newStaff, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async updateStaff(req, { params }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const updated = await StaffService.updateStaff(id, body);
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }

  static async deleteStaff(req, { params }) {
    try {
      const { id } = await params;
      const result = await StaffService.deleteStaff(id);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  }
}
