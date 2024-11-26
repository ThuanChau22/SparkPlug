import User from "../repositories/UserRepository.js";
import utils from "../utils.js";

export const getUsers = async (req, res) => {
  try {
    const { fields, limit, cursor, ...filter } = req.query;
    const select = {};
    for (const field of fields ? fields.split(",") : []) {
      select[field] = 1;
    }
    select.password = 0;
    const sort = { created_at: 1, id: 1 };
    const options = { filter, select, sort, limit, cursor };
    const data = await User.getUsers(options);
    res.status(200).json({
      users: data.users,
      cursor: data.cursor,
    });
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) {
      throw { code: 404, message: "User not found" };
    }
    res.status(200).json(user);
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const updateUserById = async (req, res) => {
  try {
    const currentUser = await User.getUserById(req.params.id);
    if (!currentUser) {
      throw { code: 404, message: "User not found" };
    }
    const { password, ...remain } = req.body;
    const userData = { id: req.params.id, ...remain };
    if (!await User.updateUserById(userData)) {
      throw { code: 400, message: "User not updated" };
    }
    res.status(200).json(await User.getUserById(userData.id));
  } catch (error) {
    return utils.handleError(res, error);
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const currentUser = await User.getUserById(req.params.id);
    if (!currentUser) {
      throw { code: 404, message: "User not found" };
    }
    if (!await User.deleteUserById(req.params.id)) {
      throw { code: 400, message: "User not deleted" };
    }
    res.status(204).json({});
  } catch (error) {
    return utils.handleError(res, error);
  }
};
