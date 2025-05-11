import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import landCadastral from "../controllers/landCadastral";
import cadastralUpdateRequestController from "../controllers/cadastralUpdateRequestController";

router.post(
  "/create-cadastral-update-request/:ogcFid",
  isLoggedIn,
  (req, res, next) => {
    cadastralUpdateRequestController.createRequest(req, res, next);
  }
);

router.get("/get-all", isLoggedIn, isAdmin, (req, res, next) => {
  cadastralUpdateRequestController.getCadastralUpdateRequests(req, res, next);
});

router.post(
  "/approve-update-request/:id",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    cadastralUpdateRequestController.approveCadastralUpdateRequest(
      req,
      res,
      next
    );
  }
);
router.post(
  "/reject-update-request/:id",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    cadastralUpdateRequestController.rejectCadastralUpdateRequest(
      req,
      res,
      next
    );
  }
);

router.get("/get-my-update-requests", isLoggedIn, (req, res, next) => {
  cadastralUpdateRequestController.getUserCadastralUpdateRequests(
    req,
    res,
    next
  );
});

module.exports = router;
