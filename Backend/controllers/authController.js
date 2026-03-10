const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const signUp = ({ username, email, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return reject({ status: 400, message: "Email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();
      resolve(true);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const login = ({ email, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return reject({ status: 401, message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return reject({ status: 401, message: "Invalid credentials" });

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
      resolve({
        token,
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = { signUp, login };
