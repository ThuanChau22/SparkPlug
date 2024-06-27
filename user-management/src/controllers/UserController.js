import User from "../repositories/UserRepository.js";
import utils from "../utils.js";

export const getUsers = async (req, res) => {
  try {
    const filter = req.query;
    const select = { password: 0 };
    const users = await User.getUsers({ filter, select });
    res.status(200).json(users);
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
    const userData = { ...currentUser, ...req.body };
    if (!await User.updateUserById(userData)) {
      throw { code: 400, message: "Update failed" }
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
      throw { code: 400, message: "Delete failed" };
    }
    res.status(204).json({});
  } catch (error) {
    return utils.handleError(res, error);
  }
};
