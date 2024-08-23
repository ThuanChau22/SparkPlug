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
      const params = { email, hashedPassword, name, role: assignedRole };
      const userId = await User.createUser(params);
      user = await User.getUserById(userId);
    } catch (error) {
      if (error.errno === 1062) {
        const filter = { email };
        const { users: [existedUser] } = await User.getUsers({ filter });
        if (existedUser[assignedRole]) {
          throw { code: 409, message: "User already existed" };
        }
        if (!await bcrypt.compare(password, existedUser.password)) {
          throw { code: 401, message: "Invalid credentials" };
        }
        await User.addRole(existedUser.id, assignedRole);
        user = existedUser;
      } else {
        throw error;
      }
    }
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
    const filter = { email, [role]: 1 };
    const { users: [user] } = await User.getUsers({ filter });
    if (!user
      || !Object.values(User.Role).includes(role)
      || !(await bcrypt.compare(password, user.password))
    ) {
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
