import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";
import userRepository, { Role } from "../repositories/UserRepository.js";

const tokenLimit = "15d";

export const signup = async (req, res) => {
  try {
    const { email, password, name, role = Role.Driver } = req.body;
    const assignedRole = role === Role.Staff ? Role.Driver : role;
    let user;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await userRepository.createUser({ email, hashedPassword, name });
      user = await userRepository.getUserById(userId);
    } catch (error) {
      if (error.errno === 1062) {
        user = await userRepository.getUserByEmail(email);
        if (!await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        if (await userRepository.getUserByIdAndRole(user.id, assignedRole)) {
          return res.status(409).json({ message: "User already existed" });
        }
      } else {
        throw error;
      }
    }
    await userRepository.addRole(user.id, assignedRole);
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: assignedRole,
    }, JWT_SECRET, { expiresIn: tokenLimit });
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role = Role.Driver } = req.body;
    const user = await userRepository.getUserByEmailAndRole(email, role);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: role,
    }, JWT_SECRET, { expiresIn: tokenLimit });
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    return res.status(200).json({ ...jwt.verify(token, JWT_SECRET) });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: error.message });
  }
};
