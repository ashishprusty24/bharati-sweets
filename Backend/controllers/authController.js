const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_jwt_secret";
const signUp = ({ username, email, password }) => {
  return new Promise(async (resolve, reject) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    resolve(true);
  });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

  return {
    success: true,
    message: "Login successful",
    token,
    user: { id: user._id, username: user.username, email: user.email },
  };
};

module.exports = { signUp, login };
