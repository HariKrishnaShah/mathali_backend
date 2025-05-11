import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import gharBatoSifarishController from "../controllers/gharBatoSifarishController";

router.post("/create", isLoggedIn, (req, res, next) => {
  gharBatoSifarishController.createSifarish(req, res, next);
});
router.get("/get-by-uuid/:uuid", (req, res, next) => {
  gharBatoSifarishController.getSifarishByUuid(req, res, next);
});

router.post("/toggle-is-valid/:id", isLoggedIn, (req, res, next) => {
  gharBatoSifarishController.toggleValidState(req, res, next);
});

router.delete("/delete/:id", isLoggedIn, (req, res, next) => {
  gharBatoSifarishController.deleteSifarish(req, res, next);
});

router.get("/get-all", isLoggedIn, (req, res, next) => {
  gharBatoSifarishController.getSifarish(req, res, next);
});

module.exports = router;
