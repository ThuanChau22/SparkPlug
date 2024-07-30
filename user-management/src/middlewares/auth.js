import jwt from "jsonwebtoken";

import User from "../repositories/UserRepository.js";
import { JWT_SECRET } from "../config.js";
import utils from "../utils.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw { code: 401, message: "Missing token" };
    }
    const [_, token] = authHeader.split(" ");
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error = { code: 401, message: "Invalid token" };
    }
    if (error.name === "TokenExpiredError") {
      error = { code: 401, message: "Expired token" };
    }
    return utils.handleError(res, error);
  }
};

export const authorizeRole = (role) => (req, res, next) => {
  try {
    if (req.user.role !== role) {
      throw { code: 403, message: "Access denied" };
    }
    next();
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const authorizeResource = async (req, res, next) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) {
      throw { code: 404, message: "User not found" };
    }
    if (req.user.role !== User.Role.Staff && req.user.id !== user.id) {
      throw { code: 403, message: "Access denied" };
    }
    next();
  } catch (error) {
    return utils.handleError(res, error);
  }
};