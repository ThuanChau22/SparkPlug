import User from "../repositories/UserRepository.js";

export const getUsers = async (req, res) => {
  try {
    const filter = req.query;
    const select = "id, email, name, status, created_at, updated_at";
    const users = await User.getUsers({ filter, select });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const currentUser = await User.getUserById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = { ...currentUser, ...req.body };
    if (!await User.updateUserById(userData)) {
      return res.status(400).json({ message: "Update failed" });
    }
    res.status(200).json(await User.getUserById(userData.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    if (!await User.deleteUserById(req.params.id)) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).json({});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
