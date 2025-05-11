import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import roadController from "../controllers/roadController";

router.get("/road-geojson", (req, res, next) => {
  roadController.getFilteredRoads(req, res, next);
});

router.get("/road-by-ogcFid/:ogcFid", isLoggedIn, (req, res, next) => {
  roadController.getRoadByOgcFid(req, res, next);
});
router.get("/road-data-view", isLoggedIn, (req, res, next) => {
  roadController.getAll(req, res, next);
});
router.get("/road-stats", isLoggedIn, (req, res, next) => {
  roadController.getStats(req, res, next);
});
router.get("/pole-geojson", isLoggedIn, (req, res, next) => {
  roadController.getPoles(req, res, next);
});

router.patch("/update-road/:ogcFid", isLoggedIn, (req, res, next) => {
  roadController.update(req, res, next);
});

module.exports = router;
