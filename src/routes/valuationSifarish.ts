import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import valuationSifarishController from "../controllers/valuationSifarishController";
router.post("/create", isLoggedIn, (req, res, next) => {
  valuationSifarishController.createSifarish(req, res, next);
});
router.get("/get-by-uuid/:uuid", (req, res, next) => {
  valuationSifarishController.getSifarishByUuid(req, res, next);
});

router.post("/toggle-is-valid/:id", isLoggedIn, (req, res, next) => {
  valuationSifarishController.toggleValidState(req, res, next);
});

router.delete("/delete/:id", isLoggedIn, (req, res, next) => {
  valuationSifarishController.deleteSifarish(req, res, next);
});

router.get("/get-all", isLoggedIn, (req, res, next) => {
  valuationSifarishController.getSifarish(req, res, next);
});

module.exports = router;
