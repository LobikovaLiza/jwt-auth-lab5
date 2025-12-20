
const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // Public routes
  app.get("/api/test/all", controller.allAccess);

  // Get user profile (requires token)
  app.get(
    "/api/auth/me",
    [authJwt.verifyToken],
    authController.me
  );

  // Protected routes with different access levels
  app.get(
    "/api/test/user",
    [authJwt.verifyToken, authJwt.isUser],
    controller.userBoard
  );

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  // User management (admin only)
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );

  app.get(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getUserById
  );

  app.put(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.updateUser
  );

  app.delete(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deleteUser
  );

  // Activate/deactivate user
  app.put(
    "/api/users/:id/activate",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.activateUser
  );

  app.put(
    "/api/users/:id/deactivate",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deactivateUser
  );
};