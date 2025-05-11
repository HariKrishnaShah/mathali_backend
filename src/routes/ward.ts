import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isAdmin } from "../middleware/isAdmin";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import wardController from "../controllers/wardController";

router.get("/get-ward", isLoggedIn, (req, res, next) => {
  wardController.getWard(req, res, next);
});

module.exports = router;
