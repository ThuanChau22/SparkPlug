import { db } from "../config.js";
import utils from "../utils.js";

const repository = {};

repository.Role = {
  Staff: "staff",
  Owner: "owner",
  Driver: "driver",
};

repository.Status = {
  Active: "active",
  Blocked: "blocked",
  Terminated: "terminated",
};

const roleToTable = (role) => {
  return role === repository.Role.Staff
    ? "Staff"
    : role === repository.Role.Owner
      ? "Station_Owner"
      : "Driver";
};

repository.getFields = async () => {
  const [result] = await db.query("SHOW COLUMNS FROM User");
  return result.map(({ Field }) => Field);
};

repository.addRole = async (userId, role) => {
  const roleTable = roleToTable(role);
  await db.query(`INSERT INTO ${roleTable} (id) VALUES (?)`, [userId]);
};

repository.getUsers = async ({ filter = {}, select = "" } = {}) => {
  let query = `SELECT ${select || "*"} FROM User`;
  const fieldValues = [];
  if (!utils.isObjectEmpty(filter)) {
    const fields = new Set(await repository.getFields());
    for (const [field, value] of Object.entries(filter)) {
      if (fields.has(field)) {
        query += `${fieldValues.length === 0 ? " WHERE" : " AND"} ${field} = ?`;
        fieldValues.push(Array.isArray(value) ? value[0] : value);
      }
    }
  }
  const [result] = await db.query(query, fieldValues);
  return result;
};

repository.getUserById = async (userId) => {
  const select = "id, email, name, status, created_at, updated_at";
  const [
    [[user]],
    [[{ isStaff }]],
    [[{ isOwner }]],
    [[{ isDriver }]],
  ] = await Promise.all([
    db.query(`SELECT ${select} FROM User WHERE id = ?`, [userId]),
    db.query("SELECT EXISTS(SELECT * FROM Staff WHERE id = ?) AS isStaff", [userId]),
    db.query("SELECT EXISTS(SELECT * FROM Station_Owner WHERE id = ?) AS isOwner", [userId]),
    db.query("SELECT EXISTS(SELECT * FROM Driver WHERE id = ?) AS isDriver", [userId]),
  ]);
  if (user) {
    user.roles = [];
    if (isStaff) {
      user.roles.push(repository.Role.Staff);
    }
    if (isOwner) {
      user.roles.push(repository.Role.Owner);
    }
    if (isDriver) {
      user.roles.push(repository.Role.Driver);
    }
  }
  return user;
};

repository.getUserByEmailAndRole = async (email, role) => {
  const roleTable = roleToTable(role);
  const [[user]] = await db.query(
    `SELECT * FROM User JOIN ${roleTable} USING(id) WHERE email = ?`,
    [email],
  );
  return user;
};

repository.createUser = async (userData) => {
  const { Active } = repository.Status;
  const { email, hashedPassword, name, status = Active } = userData;
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
  await Promise.all([
    db.query("DELETE FROM Staff WHERE id = ?", [userId]),
    db.query("DELETE FROM Station_Owner WHERE id = ?", [userId]),
    db.query("DELETE FROM Driver WHERE id = ?", [userId]),
  ]);
  const [result] = await db.query("DELETE FROM User WHERE id = ?", [userId]);
  return result.affectedRows > 0;
};

export default repository;
