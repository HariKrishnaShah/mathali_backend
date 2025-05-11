import { Request, Response, NextFunction } from "express";
import path from "path";
// Add a middleware to set the upload folder before multer processes files
export const setUploadFolderForSurveyData = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get surveyId from the body
    const { surveyId } = req.params;

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: "Survey ID is required to determine upload location.",
      });
    }

    // Set the upload folder path
    req.uploadFolder = path.join(
      __dirname,
      "../uploads",
      "survey_data",
      `${surveyId}`
    );

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("Error setting upload folder:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing upload request",
    });
  }
};
