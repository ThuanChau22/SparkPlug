import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";
import User from "../repositories/UserRepository.js";
import utils from "../utils.js";

const saltRounds = 12;
const tokenLimit = "15d";

export const signup = async (req, res) => {
  try {
    const { Role: { Staff, Driver } } = User;
    const { email, password, name, role = Driver } = req.body;
    const assignedRole = role === Staff ? Driver : role;
    let user;
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userId = await User.createUser({ email, hashedPassword, name });
      user = await User.getUserById(userId);
    } catch (error) {
      if (error.errno === 1062) {
        const filter = { email };
        user = (await User.getUsers({ filter }))[0];
        if (!await bcrypt.compare(password, user.password)) {
          throw { code: 401, message: "Invalid credentials" };
        }
        user = await User.getUserById(user.id);
        if (user.roles.includes(assignedRole)) {
          throw { code: 409, message: "User already existed" };
        }
      } else {
        throw error;
      }
    }
    await User.addRole(user.id, assignedRole);
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: assignedRole,
    }, JWT_SECRET, { expiresIn: tokenLimit });
    res.status(201).json({ token });
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role = User.Role.Driver } = req.body;
    const user = await User.getUserByEmailAndRole(email, role);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw { code: 401, message: "Invalid credentials" };
    }
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: role,
    }, JWT_SECRET, { expiresIn: tokenLimit });
    res.status(201).json({ token });
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const verify = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw { code: 401, message: "Missing token" };
    }
    return res.status(200).json({ ...jwt.verify(token, JWT_SECRET) });
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
