const Staff = require("../models/Staff");

const getAllStaff = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const staff = await Staff.find();
      resolve(staff);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createStaff = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const staff = new Staff(data);
      const newStaff = await staff.save();
      resolve(newStaff);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getAllStaff, createStaff };
