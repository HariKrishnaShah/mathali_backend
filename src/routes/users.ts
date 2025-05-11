import express from "express";
const router = express.Router();
import userController from "../controllers/userController";
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";

//User create garna ko lagi
router.post("/create-user", isLoggedIn, isAdmin, (req, res, next) => {
  userController.createUser(req, res, next);
});

//user login garna ko lag

router.post("/login", (req, res, next) => {
  userController.login(req, res, next);
});

router.post("/login-mobile", (req, res, next) => {
  userController.loginMobile(req, res, next);
});

router.get("/profile", isLoggedIn, (req: any, res, next) => {
  userController.getProfile(req, res, next);
});

router.post("/logout", isLoggedIn, (req, res, next) => {
  userController.logout(req, res, next);
});

router.get("/get-all-users", isLoggedIn, isAdmin, (req, res, next) => {
  userController.getUsers(req, res, next);
});

router.delete("/delete-user/:id", isLoggedIn, isAdmin, (req, res, next) => {
  userController.deleteUser(req, res, next);
});

router.get("/get-user-by-id/:id", isLoggedIn, (req, res, next) => {
  userController.getUserById(req, res, next);
});

router.post("/change-password/:id", isLoggedIn, (req, res, next) => {
  userController.changePassword(req, res, next);
});

router.patch("/update-user/:id", isLoggedIn, (req, res, next) => {
  userController.updateUser(req, res, next);
});

router.patch("/block/:id", isLoggedIn, isSuperAdmin, (req, res, next) => {
  userController.toggleBlocked(req, res, next);
});

router.get("/login-logs", isLoggedIn, isSuperAdmin, (req, res, next) => {
  userController.getLoginLogs(req, res, next);
});
router.get(
  "/login-logs/:userId",
  isLoggedIn,
  isSuperAdmin,
  (req, res, next) => {
    userController.getUserLoginLogs(req, res, next);
  }
);

router.patch("/revoke-tokens", isLoggedIn, isSuperAdmin, (req, res, next) => {
  userController.revokeLoginLogs(req, res);
});

router.get("/logged-in-users", isLoggedIn, isSuperAdmin, (req, res, next) => {
  userController.getLoggedInUsers(req, res);
});

router.get("/new-access-token", (req, res, next) => {
  userController.issueNewAccessToken(req, res, next);
});

module.exports = router;
