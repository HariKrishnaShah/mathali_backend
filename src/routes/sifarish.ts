import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import sifarishController from "../controllers/sifarishController";

router.post("/create", isLoggedIn, (req, res, next) => {
  sifarishController.createSifarish(req, res, next);
});
router.get("/get-by-uuid/:uuid", (req, res, next) => {
  sifarishController.getSifarishByUuid(req, res, next);
});

router.post("/toggle-is-valid/:id", isLoggedIn, (req, res, next) => {
  sifarishController.toggleValidState(req, res, next);
});

router.delete("/delete/:id", isLoggedIn, (req, res, next) => {
  sifarishController.deleteSifarish(req, res, next);
});

router.get("/get-all", isLoggedIn, (req, res, next) => {
  sifarishController.getSifarish(req, res, next);
});

module.exports = router;
