import axios from "axios";

import {
  AUTH_API_ENDPOINT,
  STATION_API_ENDPOINT,
} from "../config.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing token" });
    }
    const [_, token] = authHeader.split(" ");
    const { data } = await axios.post(`${AUTH_API_ENDPOINT}/verify`, { token });
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
    const { data } = await axios.get(`${STATION_API_ENDPOINT}/${id}`, { headers });
    if (!data) {
      throw { code: 403, message: `Access denied` };
    }
    next();
  } catch (error) {
    const { code, message } = error;
    return res.status(code || 400).json({ message });
  }
};
