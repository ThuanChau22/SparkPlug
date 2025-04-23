import axios from "axios";

import {
  AUTH_API,
  STATION_API,
} from "../config.js";
import utils from "../utils/utils.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing token" });
    }
    const [_, token] = authHeader.split(" ");
    const { data } = await axios.post(`${AUTH_API}/verify`, { token });
    req.user = data;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authorizeRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export const authorizeResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const headers = { Authorization: `Bearer ${req.token}` };
    const { data } = await axios.get(`${STATION_API}/${id}`, { headers });
    if (!data) {
      throw { code: 403, message: "Access denied" };
    }
    next();
  } catch (error) {
    if (error.response) {
      const { status, statusText } = error.response;
      const message = error.response.data.message || statusText;
      return res.status(status).json({ message });
    }
    const { code, message } = error;
    return res.status(code || 400).json({ message });
  }
};

export const handleParameters = async (req, _, next) => {
  const { sort_by, limit, ...filter } = req.query;

  for (const [field, value] of Object.entries(filter)) {
    delete req.query[field];
    const key = utils.snakeToCamel(field);
    req.query[key] = utils.isInteger(value) ? parseInt(value) : value;
  }

  if (sort_by) {
    req.query.sort_by = {};
    for (const field of sort_by.split(",")) {
      const isDesc = /^-(.*)+$/.test(field);
      const key = isDesc ? field.substring(1) : field;
      req.query.sort_by[utils.snakeToCamel(key)] = isDesc ? -1 : 1;
    }
  }

  if (limit) {
    const value = parseInt(limit);
    req.query.limit = Number.isNaN(value) ? 0 : value;
  }
  next();
};
