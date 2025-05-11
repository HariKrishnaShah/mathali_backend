import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import landZones from "../controllers/landZones";

// Agriculture land zone route
router.get("/agriculture", isLoggedIn, (req, res, next) => {
  landZones.getAgriculture(req, res, next);
});

// Commercial land zone route
router.get("/commercial", isLoggedIn, (req, res, next) => {
  landZones.getCommercial(req, res, next);
});

// Forest land zone route
router.get("/forest", isLoggedIn, (req, res, next) => {
  landZones.getForest(req, res, next);
});

// Industrial land zone route
router.get("/industrial", isLoggedIn, (req, res, next) => {
  landZones.getIndustrial(req, res, next);
});

// Public Use land zone route
router.get("/public-use", isLoggedIn, (req, res, next) => {
  landZones.getPublicUse(req, res, next);
});

// Residential land zone route
router.get("/residential", isLoggedIn, (req, res, next) => {
  landZones.getResidential(req, res, next);
});

// Water Bodies land zone route
router.get("/water-bodies", isLoggedIn, (req, res, next) => {
  landZones.getWaterBodies(req, res, next);
});

module.exports = router;
