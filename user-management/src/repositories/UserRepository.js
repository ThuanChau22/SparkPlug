import { db } from "../config.js";

const repository = {};

export const Role = {
  Staff: "staff",
  Owner: "owner",
  Driver: "driver",
};

const roleToTable = (role) => {
  return role === Role.Staff
    ? "Staff"
    : role === Role.Owner
      ? "Station_Owner"
      : "Driver";
};

repository.addRole = async (userId, role) => {
  role = roleToTable(role);
  await db.query(`INSERT INTO ${role} (id) VALUES (?)`, [userId]);
};

repository.getAllUsers = async () => {
  const select = "id, email, name, status, created_at, updated_at";
  const [users] = await db.query(`SELECT ${select} FROM User`);
  return users;
};

repository.getUserById = async (userId) => {
  const select = "id, email, name, status, created_at, updated_at";
  const [users] = await db.query(`SELECT ${select} FROM User WHERE id = ?`, [userId]);
  return users[0];
};

repository.getUserByIdAndRole = async (userId, role) => {
  role = roleToTable(role);
  const [result] = await db.query(`SELECT id FROM ${role} WHERE id = ?`, [userId]);
  return result.length > 0;
};

repository.getUserByEmail = async (email) => {
  const [users] = await db.query(`SELECT * FROM User WHERE email = ?`, [email]);
  return users[0];
};

repository.getUserByEmailAndRole = async (email, role) => {
  role = roleToTable(role);
  const [users] = await db.query(
    `SELECT * FROM User JOIN ${role} USING(id) WHERE email = ?`,
    [email],
  );
  return users[0];
};

repository.createUser = async (userData) => {
  const { email, hashedPassword, name, status = "Active" } = userData;
  const [result] = await db.query(
    "INSERT INTO User (email, password, name, status) VALUES (?, ?, ?, ?)",
    [email, hashedPassword, name, status],
  );
  return result.insertId;
};

repository.updateUserById = async (userData) => {
  const { id, email, name, status } = userData;
  const [result] = await db.query(
    "UPDATE User SET email = ?, name = ?, status = ? WHERE id = ?",
    [email, name, status, id]
  );
  return result.affectedRows > 0;
};

repository.deleteUserById = async (userId) => {
  try {
    await db.query("DELETE FROM Staff WHERE id = ?", [userId]);
    await db.query("DELETE FROM Driver WHERE id = ?", [userId]);
    await db.query("DELETE FROM Station_Owner WHERE id = ?", [userId]);
    const [result] = await db.query("DELETE FROM User WHERE id = ?", [userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

export default repository;
