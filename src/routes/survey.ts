import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isAdmin } from "../middleware/isAdmin";
import { isSuperAdmin } from "../middleware/isSuperAdmin"; // Assuming you might need this later
import surveyController from "../controllers/surveyController";
import isLoggedInMobile from "../middleware/isLoggedInMobile";
// Middleware to check if the user is logged in

router.get("/active-survey-list", isLoggedInMobile, (req, res, next) => {
  // Remove isActive field from req.query if it exists
  if (req.query.isActive) {
    delete req.query.isActive;
  }

  surveyController.getAllWithData(req, res, next);
});

router.get("/survey-options", isLoggedIn, (req, res, next) => {
  surveyController.getAllSurveysForMapOptions(req, res, next);
});
// Route for creating a survey
router.post("/", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.create(req, res, next);
});

// Route for retrieving a survey by ID
router.get("/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.getById(req, res, next);
});

router.get("/get-survey-intro/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.getById(req, res, next);
});

// Route for retrieving a survey by ID
router.get(
  "/survey-excluding-id/:id",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    surveyController.getByIdForEditing(req, res, next);
  }
);

router.get("/", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.getAll(req, res, next);
});

router.put("/update-categories/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.updateSurveyCategories(req, res, next);
});

// Route for updating a survey
router.patch("/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.updateSurvey(req, res, next);
});

// Route for deleting a survey
router.delete("/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.deleteSurvey(req, res, next);
});

router.get("/categories/search", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.searchCategories(req, res, next);
});

// Route for searching questions by description
router.get("/questions/search", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.searchQuestions(req, res, next);
});

router.get("/category/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.getCategoryById(req, res, next); // Adjust based on your controller's structure
});

// Route for retrieving a question by ID
router.get("/question/:id", isLoggedIn, isAdmin, (req, res, next) => {
  surveyController.getQuestionById(req, res, next); // Adjust based on your controller's structure
});

router.get("/download/:surveyId", isLoggedIn, (req, res, next) => {
  surveyController.downloadSurveyDetails(req, res, next);
});


router.get('/survey-list/get-survey-where-i-collected-response', isLoggedInMobile, (req, res,next)=>{
  surveyController.getAllSurveyWhereAUserhasCollectedAResponse(req, res, next);
})
module.exports = router; // Use ES6 export
