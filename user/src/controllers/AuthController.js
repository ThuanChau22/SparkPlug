// AuthController.js
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/AuthRepository.js";
import bcrypt from "bcrypt";

const secretKey = process.env.JWT_SECRET;

const Role = {
  Staff: "staff",
  Owner: "owner",
  Driver: "driver",
};

export const userSignUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    let user = await authRepository.findUserByEmail(email);

    if (!user) {
      const userId = await authRepository.createUser({ email, password, name });
      await authRepository.addRoleToUser(userId, "Driver"); // Default role
      user = await authRepository.findUserByEmail(email);
    } else {
      const hasRole = await authRepository.findRoleById(user.id, "Driver");
      if (!hasRole) {
        return res
          .status(400)
          .json({ message: "Email already used for another role" });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "Driver" },
      secretKey
    );
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await authRepository.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    let r = "";
    if (role === Role.Staff) {
      r = "Staff";
    } else if (role === Role.Owner) {
      r = "Station_Owner";
    } else {
      r = "Driver";
    }
    const hasRole = await authRepository.findRoleById(user.id, r);
    if (!hasRole) {
      return res.status(401).json({ message: "Not authorized for this role" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role }, secretKey);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
