import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import house from "../controllers/houseController";
import isLoggedInMobile from "../middleware/isLoggedInMobile";
router.get("/get-house-geojson", isLoggedIn, (req, res, next) => {
  house.getHouses(req, res, next);
});
router.get(
  "/get-house-geojson-by-ogcFid/:ogcFid",
  isLoggedIn,
  (req, res, next) => {
    house.getHouseByOgcFid(req, res, next);
  }
);
router.get(
  "/get-house-data-by-ogcFid/:ogcFid",
  isLoggedIn,
  (req, res, next) => {
    house.getHouseDetailsByOgcFid(req, res, next);
  }
);

router.get("/get-house-data", isLoggedIn, (req, res, next) => {
  house.getAll(req, res, next);
});

router.patch("/update-house/:ogcFid", isLoggedIn, (req, res, next) => {
  house.update(req, res, next);
});
router.get("/stats", isLoggedIn, (req, res, next) => {
  house.getStats(req, res, next);
});

router.get(
  "/validate-house/:google_plus_code",
  isLoggedInMobile,
  (req, res, next) => {
    house.checkHouseGooglePlusValidity(req, res, next);
  }
);

router.post(
  "/update-number-plate-installed-status/:ogcFid",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    house.toggleIsNumberPlateInstalled(req, res, next);
  }
);

router.get(
  "/house-number-plate-installation-stats",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    house.getNumberPlateStatistics(req, res, next);
  }
);

module.exports = router;
