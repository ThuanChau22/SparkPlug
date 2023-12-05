// AuthRepository.js
import db from "./config.js";
import bcrypt from "bcrypt";

export const findUserByEmail = async (email) => {
  const [users] = await db.query("SELECT * FROM User WHERE email = ?", [email]);
  return users[0];
};

export const findRoleById = async (userId, role) => {
  const [result] = await db.query(`SELECT id FROM ${role} WHERE id = ?`, [
    userId,
  ]);
  return result.length > 0;
};

export const createUser = async (userData) => {
  const { email, password, name } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    "INSERT INTO User (email, password, name) VALUES (?, ?, ?)",
    [email, hashedPassword, name]
  );
  return result.insertId;
};

export const addRoleToUser = async (userId, role) => {
  await db.query(`INSERT INTO ${role} (id) VALUES (?)`, [userId]);
};
