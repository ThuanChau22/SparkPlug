import userRepository from "../repositories/UserRepository.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userRepository.getUserById(req.params.id);
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
    const currentUser = await userRepository.getUserById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = { ...currentUser, ...req.body };
    if (!await userRepository.updateUserById(userData)) {
      return res.status(400).json({ message: "Update failed" });
    }
    res.status(200).json(await userRepository.getUserById(userData.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    if (!await userRepository.deleteUserById(req.params.id)) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User is deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
