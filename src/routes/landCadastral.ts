import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import landCadastral from "../controllers/landCadastral";

router.get("/get-land-cadastral", isLoggedIn, (req, res, next) => {
  landCadastral.getCadastral(req, res, next);
});

router.get(
  "/get-one-cadastral-geojson/:ogcFid",
  isLoggedIn,
  (req, res, next) => {
    landCadastral.getCadastralById(req, res, next);
  }
);
router.get(
  "/get-one-cadastral-point-geojson/:ogcFid",
  isLoggedIn,
  (req, res, next) => {
    landCadastral.getCadastralPointById(req, res, next);
  }
);

router.patch("/update-cadastral/:ogcFid", isLoggedIn, (req, res, next) => {
  landCadastral.updateCadastral(req, res, next);
});

router.get("/get-land-cadastral-data", isLoggedIn, (req, res, next) => {
  landCadastral.getAll(req, res, next);
});
router.get("/get-land-cadastral-point", isLoggedIn, (req, res, next) => {
  landCadastral.getAllPointData(req, res, next);
});

router.get("/get-sheets", isLoggedIn, (req, res, next) => {
  landCadastral.getSheets(req, res, next);
});
router.get("/get-parcels", isLoggedIn, (req, res, next) => {
  landCadastral.getParcels(req, res, next);
});

router.get("/stats", isLoggedIn, (req, res, next) => {
  landCadastral.getStats(req, res, next);
});
router.get("/stats-tax-profile", isLoggedIn, (req, res, next) => {
  landCadastral.getStatsTaxProfile(req, res, next);
});

router.get("/get-tax-cadastral", isLoggedIn, (req, res, next) => {
  landCadastral.getCadastralForTaxModule(req, res, next);
});
router.get("/get-tax-cadastral-point", isLoggedIn, (req, res, next) => {
  landCadastral.getCadastralPointForTaxModule(req, res, next);
});

router.get("/tiles/:z/:x/:y.pbf", landCadastral.getTiles);
module.exports = router;
