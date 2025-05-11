import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn"; // Authentication middleware
import { isAdmin } from "../middleware/isAdmin"; // Admin authorization middleware
import responseController from "../controllers/responseController"; // Import the modified response controller
import isLoggedInMobile from "../middleware/isLoggedInMobile";
import { upload } from "../config/multer.config";
import { setUploadFolderForSurveyData } from "../util/setupSurveyDataUpload";
import { setUploadFolderForUpdateSurveyData } from "../util/setupSurveyDataForUpdateSurvey";

// Create a new response (accessible to logged-in users)
router.post(
  "/create-response/:surveyId",
  isLoggedInMobile,
  setUploadFolderForSurveyData,
  upload.any(),
  (req, res, next) => {
    responseController.createResponse(req, res, next);
  }
);

// Delete a response by ID (accessible to admins)
router.delete("/delete-response/:id", isLoggedIn, isAdmin, (req, res, next) => {
  responseController.deleteResponse(req, res, next);
});

// Update a response by ID (accessible to admins)
router.put(
  "/update-response/:id",
  isLoggedInMobile,
  isAdmin,
  setUploadFolderForUpdateSurveyData,
  upload.any(),
  (req, res, next) => {
    responseController.updateResponse(req, res, next);
  }
);

// Get all responses for a specific survey ID with pagination (accessible to logged-in users)
router.get("/get-responses/:surveyId", isLoggedIn, (req, res, next) => {
  responseController.getAllResponses(req, res, next);
});

// Get a specific response by ID (accessible to logged-in users)
router.get("/get-response/:id", isLoggedIn, (req, res, next) => {
  responseController.getResponseById(req, res, next);
});

router.get(
  "/download-respose/:surveyId",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    responseController.downloadSurveyResponses(req, res);
  }
);

router.get(
  "/survey-taken-house-geojson/:surveyId",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    responseController.surveyTakenHousesGeojson(req, res, next);
  }
);

router.get(
  "/survey-not-taken-house-geojson/:surveyId",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    responseController.missingGooglePlusCodeGeojson(req, res, next);
  }
);

router.get("/survey-stats/:surveyId", isLoggedIn, (req, res, next) => {
  responseController.getSurveyStats(req, res, next); // Adjust based on your controller's structure
});

router.get("/surveryors/:surveyId", isLoggedIn, (req, res, next) => {
  responseController.getSurveyors(req, res, next); // Adjust based on your controller's structure
});

// Get all responses for a specific survey ID with pagination collected by a user specified with user id
router.get(
  "/get-responses-for-a-user/:surveyId/:userId",
  isLoggedIn,
  (req, res, next) => {
    responseController.getAllResponsesTakenByAUser(req, res, next);
  }
);

// Get all responses for a specific survey ID with pagination collected by a oneself (accessible to logged-in users)
router.get(
  "/get-responses-collected-by-me/:surveyId",
  isLoggedInMobile,
  (req, res, next) => {
    responseController.getAllResponsesTakenByOneSelf(req, res, next);
  }
);


router.get(
  "/geojson/responses-collected-by-me-for-a-survey/:surveyId",
  isLoggedInMobile,
  (req, res, next) => {
    responseController.surveyTakenByOneselfHousesGeojson(req, res, next);
  }
);


// Get a specific response by ID (accessible to logged-in users)
router.get("/get-response-only-if-collected-by-me/:id", isLoggedInMobile, (req, res, next) => {
  responseController.getResponseByIdForSelfCollectedResponse(req, res, next);
});
module.exports = router;
