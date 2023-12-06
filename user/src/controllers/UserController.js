// // Import the database configuration
// import db from "../repositories/config.js";

// UserController.js
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/UserRepository.js";

const secretKey = process.env.JWT_SECRET; // Ensure you have this in your .env file

// Middleware for JWT Authentication
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Middleware for Role Authorization
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
};

// User Management Functions
export const getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.findAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userRepository.findUserById(req.params.id);
    user ? res.json(user) : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserByRfid = async (req, res) => {
  try {
    const userInfo = await userRepository.findUserByRfid(req.body.rfid);
    res.json(userInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const newUser = await userRepository.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const updatedUser = await userRepository.updateUserById(
      req.params.id,
      req.body
    );
    updatedUser
      ? res.json(updatedUser)
      : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const result = await userRepository.deleteUserById(req.params.id);
    result
      ? res.status(200).json({ message: "User is deleted successfully" })
      : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
