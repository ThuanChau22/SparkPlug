import jwt from "jsonwebtoken";

import userRepository, { Role } from "../repositories/UserRepository.js";
import { JWT_SECRET } from "../config.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing access token" });
    }
    const [_, token] = authHeader.split(" ");
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: "Token expired" });
  }
};

export const authorizeRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};

export const authorizeResource = async (req, res, next) => {
  const user = await userRepository.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (req.user.role !== Role.Staff && req.user.id !== user.id) {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};