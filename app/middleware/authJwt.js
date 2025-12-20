
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;

const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  // Удаляем "Bearer " если есть
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, config.secret);

    // Проверяем наличие deviceId в токене
    if (!decoded.deviceId) {
      return res.status(401).send({
        message: "Token missing device information!",
        code: "TOKEN_MISSING_DEVICE"
      });
    }

    req.userId = decoded.id;
    req.deviceId = decoded.deviceId; // Добавляем deviceId в запрос

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({
        message: "Token expired!",
        code: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).send({
      message: "Invalid token!",
      code: "INVALID_TOKEN"
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        return next();
      }
    }

    res.status(403).send({
      message: "Require Admin Role!"
    });

  } catch (err) {
    res.status(500).send({
      message: err.message
    });
  }
};

const isModerator = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator" || roles[i].name === "admin") {
        return next();
      }
    }

    res.status(403).send({
      message: "Require Moderator or Admin Role!"
    });

  } catch (err) {
    res.status(500).send({
      message: err.message
    });
  }
};

const isUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "user" ||
        roles[i].name === "moderator" ||
        roles[i].name === "admin") {
        return next();
      }
    }

    res.status(403).send({
      message: "Require User Role!"
    });

  } catch (err) {
    res.status(500).send({
      message: err.message
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isUser
};

module.exports = authJwt;