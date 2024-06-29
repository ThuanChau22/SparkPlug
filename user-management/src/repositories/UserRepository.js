import { encode, decode } from "safe-base64";

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

const Table = {
  User: "User",
  Staff: "Staff",
  Owner: "Station_Owner",
  Driver: "Driver",
  UserView: "users_joined",
};

const roleToTable = (role) => {
  const { Staff, Owner } = repository.Role;
  if (role === Staff) return Table.Staff;
  return role === Owner ? Table.Owner : Table.Driver;
};

const handleTransaction = async (resolve) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    return await resolve(conn);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.commit();
    conn.release();
  }
}

repository.getTableFields = async (table) => {
  const [result] = await db.query(`SHOW COLUMNS FROM ${table}`);
  return result.map(({ Field }) => Field);
};

repository.addRole = async (userId, role) => {
  return await handleTransaction(async (conn) => {
    const Role = roleToTable(role);
    const [result] = await conn.query(
      `INSERT INTO ${Role} (id) VALUES (?)`,
      [userId],
    );
    return result.affectedRows > 0;
  });
};

repository.getUsers = async ({ filter, select, sort, limit, cursor } = {}) => {
  const fieldList = await repository.getTableFields(Table.UserView);

  // Select
  let selectFields = "*";
  if (!utils.isObjectEmpty(select)) {
    const fieldSet = new Set(fieldList);
    select = Object.entries(select).filter(([field]) => fieldSet.has(field));
    for (const [field] of select.filter(([_, value]) => value === 0)) {
      fieldSet.delete(field);
    }
    if (fieldSet.size !== fieldList.length) {
      const reducer = (s, field) => `${s}, ${field}`;
      selectFields = Array.from(fieldSet).reduce(reducer);
    } else if (select.length !== 0) {
      const filter = ([field, value]) => field !== "id" && value === 1;
      const reducer = (s, [field]) => `${s}, ${field}`;
      selectFields = select.filter(filter).reduce(reducer, "id");
    }
  }
  let query = `SELECT ${selectFields} FROM ${Table.UserView}`;

  // Where
  const filterValues = [];
  if (!utils.isObjectEmpty(filter)) {
    const fieldSet = new Set(fieldList);
    for (let [field, value] of Object.entries(filter)) {
      if (fieldSet.has(field)) {
        query += ` ${filterValues.length === 0 ? "WHERE" : "AND"} ${field} = ?`;
        if (Array.isArray(value)) {
          value = value[0];
        }
        if (utils.isBoolean(value)) {
          value = utils.toBoolean(value) ? 1 : 0;
        }
        filterValues.push(value);
      }
    }
  }

  // Paging Read
  if (cursor) {
    const { id, created_at } = utils.toJSON(decode(cursor).toString()) || {};
    if (id && created_at) {
      const conditions = `created_at > ? OR (created_at = ? AND id > ?)`;
      query += `${filterValues.length === 0 ? " WHERE" : " AND"} ${conditions}`;
      filterValues.push(created_at, created_at, id);
    }
  }

  // Order
  if (!utils.isObjectEmpty(sort)) {
    const sortValues = [];
    const fieldSet = new Set(fieldList);
    for (const [field, value] of Object.entries(sort)) {
      if (fieldSet.has(field)) {
        sortValues.push(`${value === -1 ? `${field} DESC` : field}`);
      }
    }
    if (sortValues.length !== 0) {
      query += ` ORDER BY ${sortValues.reduce((s, v) => `${s}, ${v}`)}`;
    }
  }

  // Limit
  if (limit > 0) {
    query += ` LIMIT ${limit}`;
  }

  // Query
  const [users] = await db.query(query, filterValues);

  // Paging Write
  let next = "";
  if (users.length === parseInt(limit)) {
    const { id, created_at } = users[users.length - 1];
    next = encode(Buffer.from(JSON.stringify({ id, created_at })));
  }

  return { users, cursor: { next } };
};

repository.getUserById = async (userId, { select = { password: 0 } } = {}) => {
  const params = { filter: { id: userId }, select, limit: 1 };
  const { users: [user] } = await repository.getUsers(params);
  return user;
};

repository.createUser = async (userData) => {
  return await handleTransaction(async (conn) => {
    const { Active } = repository.Status;
    const { email, hashedPassword, name, role, status = Active } = userData;
    const [{ insertId }] = await conn.query(
      `INSERT INTO ${Table.User} (email, password, name, status) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, name, status],
    );
    const Role = roleToTable(role);
    await conn.query(
      `INSERT INTO ${Role} (id) VALUES (?)`,
      [insertId],
    );
    return insertId;
  });
};

repository.updateUserById = async (userData) => {
  return await handleTransaction(async (conn) => {
    const { id, ...remain } = userData;
    let query = `UPDATE ${Table.User} SET`;
    const updateValues = [];
    const fieldSet = new Set(await repository.getTableFields(Table.User));
    for (const [field, value] of Object.entries(remain)) {
      if (fieldSet.has(field)) {
        query += `${updateValues.length === 0 ? "" : ","} ${field} = ?`;
        updateValues.push(Array.isArray(value) ? value[0] : value);
      }
    }
    if (updateValues.length === 0) {
      return false;
    }
    query += ` WHERE id = ?`;
    updateValues.push(id);
    const [{ affectedRows }] = await conn.query(query, updateValues);
    return affectedRows > 0;
  });
};

repository.deleteUserById = async (userId) => {
  return await handleTransaction(async (conn) => {
    const { User, Staff, Owner, Driver } = Table;
    await Promise.all(
      [Staff, Owner, Driver].map((role) => {
        const query = `DELETE FROM ${role} WHERE id = ?`;
        return conn.query(query, [userId]);
      }));
    const [{ affectedRows }] = await conn.query(
      `DELETE FROM ${User} WHERE id = ?`,
      [userId],
    );
    return affectedRows > 0;
  });
};

export default repository;
