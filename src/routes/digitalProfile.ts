import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import isLoggedInMobile from "../middleware/isLoggedInMobile";
import digitalProfileController from "../controllers/digitalProfileController";

router.get("/get-digital-profile-houses", isLoggedIn, (req, res, next) => {
  digitalProfileController.getHouses(req, res, next);
});

//Get House Detail by Id
router.get("/get-house-by-id/:houseId", isLoggedIn, (req, res, next) => {
  digitalProfileController.getHouseData(req, res, next);
});
router.get("/get-stats", isLoggedIn, (req, res, next) => {
  digitalProfileController.getStats(req, res, next);
});

router.post("/map-view", isLoggedIn, (req, res, next) => {
  digitalProfileController.getGeojsonForMapView(req, res, next);
});

router.post("/add-house", isLoggedIn, (req, res, next) => {
  digitalProfileController.addHouse(req, res, next);
});
router.patch("/get-house-by-id/:houseId", isLoggedIn, (req, res, next) => {
  digitalProfileController.editHouse(req, res, next);
});
router.delete("/get-house-by-id/:houseId", isLoggedIn, (req, res, next) => {
  digitalProfileController.deleteHouse(req, res, next);
});
router.post("/add-family-member/:houseId", isLoggedIn, (req, res, next) => {
  digitalProfileController.addFamilyMember(req, res, next);
});

router.patch("/edit-family-member/:id", isLoggedIn, (req, res, next) => {
  digitalProfileController.editFamilyMember(req, res, next);
});
router.delete("/delete-family-member/:id", isLoggedIn, (req, res, next) => {
  digitalProfileController.deleteFamilyMember(req, res, next);
});

module.exports = router;
