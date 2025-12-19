// const { verifySignUp } = require("../middleware");
// const controller = require("../controllers/auth.controller");

// module.exports = function(app) {
//   app.use(function(req, res, next) {
//     res.header(
//       "Access-Control-Allow-Headers",
//       "x-access-token, Origin, Content-Type, Accept"
//     );
//     next();
//   });

//   app.post(
//     "/api/auth/signup",
//     [
//       verifySignUp.checkDuplicateUsernameOrEmail,
//       verifySignUp.checkRolesExisted
//     ],
//     controller.signup
//   );

//   app.post("/api/auth/signin", controller.signin);
// };
const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");
const { authJwt } = require("../middleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization, X-Device-Id, X-Device-Name"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/refresh", controller.refreshToken);

  app.post("/api/auth/logout", controller.logout);

  app.get(
    "/api/auth/devices",
    [authJwt.verifyToken],
    controller.getDevices
  );

  app.post(
    "/api/auth/devices/:deviceId/logout",
    [authJwt.verifyToken],
    controller.logoutDevice
  );

  app.post(
    "/api/auth/devices/logout-others",
    [authJwt.verifyToken],
    controller.logoutOtherDevices
  );

  app.put(
    "/api/auth/devices/:deviceId/rename",
    [authJwt.verifyToken],
    controller.renameDevice
  );

  // Дополнительный маршрут для тестирования deviceId
  app.get(
    "/api/auth/test-device",
    [authJwt.verifyToken],
    (req, res) => {
      res.status(200).send({
        userId: req.userId,
        deviceId: req.deviceId,
        message: "Device info extracted from token"
      });
    }
  );
};