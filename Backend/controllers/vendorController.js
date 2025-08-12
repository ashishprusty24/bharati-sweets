// controllers/vendorController.js
const Vendor = require("../models/Vendor");

const getAllVendors = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendors = await Vendor.find();
      resolve(vendors);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createVendor = (payload) => {
  return new Promise(async (resolve, reject) => {
    const vendor = new Vendor(payload);
    try {
      const newVendor = await vendor.save();
      resolve(newVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const updateVendor = (vendorId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedVendor) {
        return reject({ status: 404, message: "Vendor not found" });
      }
      resolve(updatedVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

const deleteVendor = (vendorId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Vendor.findByIdAndDelete(vendorId);
      if (!result) {
        return reject({ status: 404, message: "Vendor not found" });
      }
      resolve({ message: "Vendor deleted" });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const makePayment = (vendorId, paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return reject({ status: 404, message: "Vendor not found" });
      }

      vendor.transactions.push(paymentData);
      vendor.paymentDue -= paymentData.amount;
      vendor.lastPaymentDate = paymentData.date;

      const updatedVendor = await vendor.save();
      resolve(updatedVendor);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  makePayment,
};
