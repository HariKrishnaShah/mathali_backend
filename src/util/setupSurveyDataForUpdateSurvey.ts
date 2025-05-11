import { Request, Response, NextFunction } from "express";
import path from "path";
import { AppDataSource } from "../config/database";
import { Response as ResponseEntity } from "../entities/survey/Response";
import HttpError from "./httpError";
// Add a middleware to set the upload folder before multer processes files
export const setUploadFolderForUpdateSurveyData = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const response = await AppDataSource.getRepository(ResponseEntity).findOne({
      where: { id: Number(id) },
      relations: ["answers", "answers.question", "survey"],
    });

    if (!response) {
      throw new HttpError(404, "Response not found");
    }

    const surveyId = response.survey.id;

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
    req.responseRecord = response;

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
