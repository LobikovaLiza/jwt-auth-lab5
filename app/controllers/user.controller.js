// exports.allAccess = (req, res) => {
//   res.status(200).send("Test info lab4.");
// };

// exports.userBoard = (req, res) => {
//   res.status(200).send("Test User lab4.");
// };

// exports.adminBoard = (req, res) => {
//   res.status(200).send("Test Admin lab4.");
// };

const db = require("../models");
const User = db.user;
const Role = db.role;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content - Test lab4.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content - Test User lab4.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content - Test Moderator lab4.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content - Test Admin lab4.");
};

// Получение всех пользователей (для админа)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: Role,
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving users."
    });
  }
};

// Получение пользователя по ID
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: Role,
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).send({
        message: `User with id=${id} not found.`
      });
    }

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error retrieving user with id=${req.params.id}.`
    });
  }
};

// Обновление пользователя
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    // Нельзя обновлять пароль, refreshToken через этот эндпоинт
    delete updates.password;
    delete updates.refreshToken;
    delete updates.refreshTokenExpires;

    const [updated] = await User.update(updates, {
      where: { id: id }
    });

    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot update user with id=${id}. Maybe user was not found!`
      });
    }

    res.status(200).send({
      message: "User was updated successfully."
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error updating user with id=${req.params.id}.`
    });
  }
};

// Удаление пользователя
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await User.destroy({
      where: { id: id }
    });

    if (deleted === 0) {
      return res.status(404).send({
        message: `Cannot delete user with id=${id}. Maybe user was not found!`
      });
    }

    res.status(200).send({
      message: "User was deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Could not delete user with id=${req.params.id}.`
    });
  }
};

// Активация пользователя
exports.activateUser = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await User.update(
      { isActive: true },
      { where: { id: id } }
    );

    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot activate user with id=${id}. Maybe user was not found!`
      });
    }

    res.status(200).send({
      message: "User was activated successfully."
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error activating user with id=${req.params.id}.`
    });
  }
};

// Деактивация пользователя
exports.deactivateUser = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await User.update(
      { isActive: false, refreshToken: null, refreshTokenExpires: null },
      { where: { id: id } }
    );

    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot deactivate user with id=${id}. Maybe user was not found!`
      });
    }

    res.status(200).send({
      message: "User was deactivated successfully."
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error deactivating user with id=${req.params.id}.`
    });
  }
};