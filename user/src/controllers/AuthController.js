// Import necessary modules;
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../repositories/AuthRepository.js";

// Utility function to execute database queries
const executeQuery = async (query, params) => {
  try {
    const [rows] = await db.promise().query(query, params);
    return rows;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// User login function
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await executeQuery("SELECT * FROM User WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. User not found.",
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Wrong password.",
      });
    }

    const token = generateToken(user);
    res.json({ success: true, token: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User signup function
export const userSignUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUsers = await executeQuery(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Email already in use." });
    }

    await executeQuery(
      "INSERT INTO User (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const newUser = await executeQuery("SELECT * FROM User WHERE email = ?", [
      email,
    ]);
    const token = generateToken(newUser[0]);

    res.status(201).json({
      success: true,
      token: token,
      user: { id: newUser[0].id, name, email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
