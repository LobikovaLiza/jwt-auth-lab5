// const db = require("../models");
// const ROLES = db.ROLES;
// const User = db.user;

// checkDuplicateUsernameOrEmail = (req, res, next) => {
//   User.findOne({
//     where: {
//       username: req.body.username
//     }
//   }).then(user => {
//     if (user) {
//       res.status(400).send({
//         message: "Failed! Username is already in use!"
//       });
//       return;
//     }

//     User.findOne({
//       where: {
//         email: req.body.email
//       }
//     }).then(user => {
//       if (user) {
//         res.status(400).send({
//           message: "Failed! Email is already in use!"
//         });
//         return;
//       }

//       next();
//     });
//   });
// };

// checkRolesExisted = (req, res, next) => {
//   if (req.body.roles) {
//     for (let i = 0; i < req.body.roles.length; i++) {
//       if (!ROLES.includes(req.body.roles[i])) {
//         res.status(400).send({
//           message: "Failed! Role does not exist = " + req.body.roles[i]
//         });
//         return;
//       }
//     }
//   }

//   next();
// };

// const verifySignUp = {
//   checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
//   checkRolesExisted: checkRolesExisted
// };

// module.exports = verifySignUp;
const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Проверка username
    const usernameUser = await User.findOne({
      where: { username: req.body.username }
    });

    if (usernameUser) {
      return res.status(400).send({
        message: "Failed! Username is already in use!"
      });
    }

    // Проверка email
    const emailUser = await User.findOne({
      where: { email: req.body.email }
    });

    if (emailUser) {
      return res.status(400).send({
        message: "Failed! Email is already in use!"
      });
    }

    next();
  } catch (err) {
    res.status(500).send({
      message: err.message
    });
  }
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        return res.status(400).send({
          message: "Failed! Role does not exist = " + req.body.roles[i]
        });
      }
    }
  }

  next();
};

validateSignUp = (req, res, next) => {
  const { username, email, password } = req.body;

  // Проверка обязательных полей
  if (!username || !email || !password) {
    return res.status(400).send({
      message: "Username, email and password are required!"
    });
  }

  // Проверка длины username
  if (username.length < 3) {
    return res.status(400).send({
      message: "Username must be at least 3 characters long!"
    });
  }

  // Проверка длины пароля
  if (password.length < 6) {
    return res.status(400).send({
      message: "Password must be at least 6 characters long!"
    });
  }

  // Проверка email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({
      message: "Invalid email format!"
    });
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  validateSignUp
};

module.exports = verifySignUp;