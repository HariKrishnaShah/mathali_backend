import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import roadCordinateController from "../controllers/roadCordinateController";

router.get("/markers", isLoggedIn, (req, res, next) => {
  roadCordinateController.getRoadCoordinates(req, res, next);
});
router.post("/update/:ogcFid", isLoggedIn, (req, res, next) => {
  roadCordinateController.updateCoordinates(req, res, next);
});

module.exports = router;
