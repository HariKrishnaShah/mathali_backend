import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Answer } from "../entities/survey/Answer";
import { Response as SurveyResponse } from "../entities/survey/Response";
import { Category } from "../entities/survey/Category";
import HttpError from "../util/httpError";
import { Survey } from "../entities/survey/Survey";
import { User } from "../entities/user/User";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import OpenLocationCode from "open-location-code-typescript";
import { Ward } from "../entities/basic/Ward";
import { House } from "../entities/houseNumbering/House";
import { Brackets, Raw } from "typeorm";
import { Question } from "../entities/survey/Question";
import archiver from "archiver";

interface WardResponse {
  [key: number]: number; // Maps ward ID to total responses
}

interface TopUser {
  userId: number;
  userName: string;
  responseCount: number;
}

class ResponseController {
  private userRepo = AppDataSource.getRepository(User);
  private surveyRepo = AppDataSource.getRepository(Survey);
  private responseRepo = AppDataSource.getRepository(SurveyResponse);
  private answerRepo = AppDataSource.getRepository(Answer);
  private categoryRepo = AppDataSource.getRepository(Category);
  private wardRepo = AppDataSource.getRepository(Ward);
  private houseRepo = AppDataSource.getRepository(House);
  private questionRepo = AppDataSource.getRepository(Question);
  // Create a new response

  async createResponse(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { surveyId } = req.params;
      // Extract text fields from form data
      const {
        surveyTakenPlaceLatitude,
        surveyTakenPlaceLongitude,
        googlePlusCode,
        houseLatitude,
        houseLongitude,
      } = req.body;

      const surveyTakerId = req.user.id;
      if (!surveyTakerId) {
        return res
          .status(400)
          .json({ success: false, message: "Survey Taker Id missing" });
      }

      // Ensure surveyId exists
      if (!surveyId) {
        return res
          .status(400)
          .json({ success: false, message: "Survey ID is required." });
      }

      // Parse the answers (since they are sent as JSON strings in FormData)
      let answers: any[];
      try {
        answers = JSON.parse(req.body.answers);
      } catch (error) {
        console.log(error)
        return res
          .status(400)
          .json({ success: false, message: "Invalid answers format." });
      }

      const surveyTaker = await this.userRepo.findOneById(surveyTakerId);
      if (!surveyTaker) {
        return res
          .status(400)
          .json({ success: false, message: "Survey Taker not found" });
      }

      const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
      if (!survey)
        throw new HttpError(400, `Survey with ID ${surveyId} not found`);
      if (!survey.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Survey is inactive." });
      }

      // Create new Survey Response
      const response = this.responseRepo.create({
        survey: { id: surveyId },
        googlePlusCode,
        surveyTakenBy: surveyTaker,
        surveyTakenPlaceLatitude,
        surveyTakenPlaceLongitude,
        houseLatitude,
        houseLongitude,
      });

      // Save the response first to get the ID
      await this.responseRepo.save(response);

      // Process answers including images
      const processedAnswers = await Promise.all(
        answers.map(async (answer: any) => {
          const question = await this.questionRepo.findOne({
            where: { id: answer.questionId },
          });
          if (!question)
            throw new HttpError(
              400,
              `Question ID ${answer.questionId} not found`
            );

          let answerValue = answer.answer;

          // If it's a photo question, handle the uploaded files
          if (
            question.type === "photo" ||
            question.type === "video" ||
            question.type === "pdf"
          ) {
            // Check if there are files in the request
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
              // Find files associated with this question - check for both exact match and with 'photo, video or pdf' prefix
              const questionFiles = req.files.filter(
                (file: any) =>
                  file.fieldname === `${question.type}${answer.questionId}`
              );
              const wrongQuestionFiles = req.files.filter((file: any) => {
                return (
                  file.fieldname.endsWith(`${answer.questionId}`) &&
                  !file.fieldname.startsWith(question.type)
                );
              });
              if (wrongQuestionFiles && wrongQuestionFiles.length > 0) {
                throw new HttpError(
                  400,
                  "Ensure that the question type and the field used for sending the file are same."
                );
              }
              if (questionFiles && questionFiles.length > 0) {
                // Extract just the filenames
                const fileNames = questionFiles.map(
                  (file: any) => file.filename
                );

                // Always store as a JSON array, even for a single file
                answerValue = JSON.stringify(fileNames);
              } else {
                // Initialize as empty array for photo questions with no uploads
                answerValue = JSON.stringify([]);
              }
            } else {
              // Initialize as empty array if no files uploaded
              answerValue = JSON.stringify([]);
            }
          }

          // Create the answer entity
          const createdAnswer = this.answerRepo.create({
            question,
            groupId: answer.groupId || "ungrouped", // Use default if not provided
            answer: answerValue,
            response, // Associating the answer with the response
          });

          // Save the answer
          await this.answerRepo.save(createdAnswer);
          return createdAnswer;
        })
      );

      // Update the response with the processed answers
      response.answers = processedAnswers;
      const createdResponse = await this.responseRepo.save(response);

      res.status(201).json({
        success: true,
        message: "Response created successfully",
        data: createdResponse,
      });
    } catch (error) {
      console.error("Error creating response:", error);
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // Delete a response by ID
  async deleteResponse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Find the response by ID
      const response = await this.responseRepo.findOne({
        where: { id: Number(id) },
      });

      if (!response) {
        throw new HttpError(404, "Response not found");
      }

      // Delete the response
      await this.responseRepo.remove(response);

      res.status(200).json({
        success: true,
        message: "Response deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a response by ID
  async updateResponse(
    req: any, // Changed from Request to any to allow custom properties
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;

      // Parse the answers (since they are sent as JSON strings in FormData)
      let answers: any[];
      try {
        answers = JSON.parse(req.body.answers);
      } catch (error) {
        console.log(error)
        return res
          .status(400)
          .json({ success: false, message: "Invalid answers format." });
      }

      // Get Response Record from req since, it has been already been queried while setting up folder for files upload in setup folder middleware.
      const response = req.responseRecord;

      // Log files for debugging

      // Clear existing answers if you want to replace them entirely
      // First store the IDs to delete them later
      const answerIdsToDelete = response.answers.map(
        (answer: any) => answer.id
      );
      response.answers = []; // Reset existing answers in the response object

      // Process new answers
      const processedAnswers = await Promise.all(
        answers.map(async (answer: any) => {
          // Get the full question object to check its type
          const question = await this.questionRepo.findOne({
            where: { id: answer.questionId },
          });

          if (!question) {
            throw new HttpError(
              400,
              `Question ID ${answer.questionId} not found`
            );
          }

          const category = await this.categoryRepo.findOne({
            where: { questions: { id: answer.questionId } },
            relations: ["questions"],
          });

          if (!category) {
            throw new HttpError(
              400,
              `Category for question ID ${answer.questionId} not found`
            );
          }

          const isMultipleResponse = category.allowMultipleResponse;

          let answerValue = answer.answer;

          // Handle file uploads for photo questions
          if (
            question.type === "photo" ||
            question.type === "video" ||
            question.type === "pdf"
          ) {
            // Check if there are files in the request
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
              // Find files associated with this question - check for both exact match and with 'file' prefix
              const questionFiles = req.files.filter(
                (file: any) =>
                  file.fieldname === `${question.type}${answer.questionId}`
              );
              const wrongQuestionFiles = req.files.filter((file: any) => {
                return (
                  file.fieldname.endsWith(`${answer.questionId}`) &&
                  !file.fieldname.startsWith(question.type)
                );
              });
              if (wrongQuestionFiles && wrongQuestionFiles.length > 0) {
                throw new HttpError(
                  400,
                  "Ensure that the question type and the field used for sending the file are same."
                );
              }

              if (questionFiles && questionFiles.length > 0) {
                // Extract just the filenames
                const fileNames = questionFiles.map(
                  (file: any) => file.filename
                );

                // Always store as a JSON array, even for a single file
                answerValue = JSON.stringify(fileNames);
              } else if (answerValue) {
                // If no new files but existing answer value is provided, keep it
                // Make sure it's properly formatted as JSON if it's not already
                try {
                  // Check if it's already valid JSON
                  JSON.parse(answerValue);
                } catch (e) {
                  // If not valid JSON, convert it to JSON array
                  answerValue = Array.isArray(answerValue)
                    ? JSON.stringify(answerValue)
                    : JSON.stringify([answerValue]);
                }
              } else {
                // No files and no existing value
                answerValue = JSON.stringify([]);
              }
            } else if (answerValue) {
              // No new uploads but answer provided in the request
              // Make sure it's properly formatted as JSON if it's not already
              try {
                // Check if it's already valid JSON
                JSON.parse(answerValue);
              } catch (e) {
                // If not valid JSON, convert it to JSON array
                answerValue = Array.isArray(answerValue)
                  ? JSON.stringify(answerValue)
                  : JSON.stringify([answerValue]);
              }
            } else {
              // No files and no answer provided
              answerValue = JSON.stringify([]);
            }
          } else if (Array.isArray(answerValue)) {
            // For non-photo array answers, convert to JSON string
            answerValue = JSON.stringify(answerValue);
          }

          const createdAnswer = this.answerRepo.create({
            question,
            groupId: isMultipleResponse ? answer.groupId || "ungrouped" : null,
            answer: answerValue,
            response, // Link the new answer to the response
          });

          return createdAnswer;
        })
      );

      // Assign the newly created answers to the response
      response.answers = processedAnswers;

      // Delete old answers from database
      if (answerIdsToDelete.length > 0) {
        await this.answerRepo.delete(answerIdsToDelete);
      }

      // Save the updated response along with new answers
      await this.responseRepo.save(response);

      // Create a simple object to return, omitting circular references
      const responseData = {
        id: response.id,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        googlePlusCode: response.googlePlusCode,
        houseLatitude: response.houseLatitude,
        houseLongitude: response.houseLongitude,
        answers: processedAnswers.map((ans) => ({
          id: ans.id,
          questionId: ans.question.id,
          answer: ans.answer,
          groupId: ans.groupId,
        })),
      };

      res.status(200).json({
        success: true,
        message: "Response updated successfully",
        data: responseData, // Send the flattened response data
      });
    } catch (error) {
      // Enhanced error handling
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Error updating response:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  async getResponseById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(Number(id))) {
        console.error(`Invalid ID parameter: ${id}`);
        return res.status(400).json({
          success: false,
          message: "Invalid ID parameter provided.",
        });
      }

      // Find response by ID with relations and ordering
      const response = await this.responseRepo.findOne({
        where: { id: Number(id) },
        relations: [
          "answers",
          "answers.question",
          "answers.question.options",
          "answers.question.categories",
          "surveyTakenBy",
        ],
        order: {
          answers: {
            question: {
              categories: {
                orderNumber: "ASC",
              },
              orderNumber: "ASC",
            },
          },
        },
      });

      if (!response) {
        console.error(`Response not found for ID: ${id}`);
        throw new HttpError(404, "Response not found");
      }

      const user = response.surveyTakenBy;

      if (!user) {
        console.warn(
          `User not found for surveyTakenBy ID: ${response.surveyTakenBy?.id}`
        );
      }

      // Create a map to store sorted questions by category
      const categoryMap: Record<
        number,
        {
          categoryId: number;
          categoryName: string;
          orderNumber: number;
          answers: Record<string, any[]>;
        }
      > = {};

      // First, collect all categories with their order numbers
      response.answers.forEach((answer) => {
        const question = answer.question;
        const categories = question?.categories || [];

        categories.forEach((category) => {
          if (!categoryMap[category.id]) {
            categoryMap[category.id] = {
              categoryId: category.id,
              categoryName: category.name,
              orderNumber: category.orderNumber,
              answers: {},
            };
          }
        });
      });

      // Then process answers and organize them by category and group
      response.answers.forEach((answer) => {
        const question = answer.question;
        const categories = question?.categories || [];

        categories.forEach((category) => {
          const groupId = answer.groupId || "ungrouped";
          if (!categoryMap[category.id].answers[groupId]) {
            categoryMap[category.id].answers[groupId] = [];
          }

          // Sort options by orderNumber before adding to the answer
          const sortedOptions = (question?.options || []).sort(
            (a, b) => a.orderNumber - b.orderNumber
          );

          categoryMap[category.id].answers[groupId].push({
            questionId: question?.id,
            questionOrderNumber: question?.orderNumber,
            answer: answer.answer,
            question: {
              description: question?.description || "",
              type: question?.type || "",
              options: sortedOptions.map((option) => ({
                id: option.id,
                value: option.value,
                orderNumber: option.orderNumber,
              })),
            },
          });
        });
      });

      // Sort categories by orderNumber
      const sortedCategories = Object.values(categoryMap).sort(
        (a, b) => a.orderNumber - b.orderNumber
      );

      // Sort answers within each group by question orderNumber
      sortedCategories.forEach((category) => {
        Object.keys(category.answers).forEach((groupId) => {
          category.answers[groupId].sort(
            (a, b) => a.questionOrderNumber - b.questionOrderNumber
          );
        });
      });

      // Format the final response
      const formattedResponse = {
        googlePlusCode: response?.googlePlusCode,
        surveyId: response.survey?.id,
        surveyTakenById: response.surveyTakenBy?.id,
        surveyTakenPlaceLongitude: Number(response?.surveyTakenPlaceLongitude),
        surveyTakenPlaceLatitude: Number(response?.surveyTakenPlaceLatitude),
        houseLongitude: Number(response?.houseLongitude),
        houseLatitude: Number(response?.houseLatitude),
        surveyTakenByName: user
          ? `${user.firstName} ${user.lastName}`
          : "Unknown User",
        categories: sortedCategories.map((category) => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          orderNumber: category.orderNumber,
          answers: Object.entries(category.answers).map(
            ([groupId, answers]) => ({
              groupId,
              answers,
            })
          ),
        })),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      res.status(200).json({
        success: true,
        message: `Response with id: ${id} retrieved successfully.`,
        data: formattedResponse,
      });
    } catch (error) {
      console.error("Error retrieving response:", error);
      if (error instanceof HttpError) {
        return next(error);
      }
      next(new HttpError(500, "Something went wrong"));
    }
  }

  // Read all responses for a specific Survey with pagination
  async getAllResponses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const surveyId = parseInt(req.params.surveyId, 10); // Convert surveyId to a number
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      // Find responses for the specified surveyId with pagination
      const [responses, totalItems] = await this.responseRepo.findAndCount({
        where: { survey: { id: surveyId } },
        order: { createdAt: "DESC" }, // Sort by createdAt in descending order
        relations: ["surveyTakenBy"], // Include surveyTakenBy relation
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Add S.N to each response
      const serialOffset = (page - 1) * pageSize;
      const responsesWithSN = responses.map((response, index) => {
        const { updatedAt, modifiedBy, surveyTakenBy, ...rest } = response; // Exclude unwanted fields

        return {
          SN: serialOffset + index + 1, // Calculate serial number based on current page,
          surveyTaker:
            response.surveyTakenBy?.firstName ??
            "" + response.surveyTakenBy?.lastName ??
            "",
          ...rest,
        };
      });
      // Pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      res.status(200).json({
        success: true,
        message: `Responses for survey ID: ${surveyId} retrieved successfully.`,
        data: responsesWithSN,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async downloadSurveyResponses(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const uploadsDir = path.join(
        __dirname,
        "..",
        "uploads",
        "survey_data",
        surveyId
      );

      // Set headers for streaming zip file download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=survey_${surveyId}_responses.zip`
      );

      // Create and pipe the archive directly to the response
      const archive = archiver("zip", { zlib: { level: 5 } }); // Lower compression level for better streaming performance

      // Pipe archive data stream directly to the response
      archive.pipe(res);

      // On archive error
      archive.on("error", (err) => {
        console.error("Archive error:", err);
        // We can't send an error response here as headers are already sent
        // Just end the response stream
        res.end();
      });

      // Fetch survey and response data with ordering
      const survey = await this.surveyRepo.findOne({
        where: { id: Number(surveyId) },
        relations: [
          "categories",
          "categories.questions",
          "categories.questions.options",
        ],
        order: {
          categories: {
            orderNumber: "ASC",
            questions: {
              orderNumber: "ASC",
            },
          },
        },
      });

      if (!survey) {
        throw new HttpError(404, "Survey not found");
      }

      // Create a temporary directory for our files before adding to zip
      const tempDir = path.join(__dirname, `temp_${surveyId}_${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create attachments directory inside temp directory
      const attachmentsDir = path.join(tempDir, "attachments");
      if (!fs.existsSync(attachmentsDir)) {
        fs.mkdirSync(attachmentsDir, { recursive: true });
      }

      // Create an index.html file for file navigation
      let indexHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Survey ${surveyId} Attachments</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 5px 0; }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Survey ${surveyId} Attachments</h1>
          <ul>
      `;

      // Generate the Excel workbook
      const workbook = new ExcelJS.Workbook();
      const responseSheet = workbook.addWorksheet("Responses");
      responseSheet.addRow([
        "Response ID",
        "Google Plus Code",
        "Latitude",
        "Longitude",
        "Survey Taken Place Latitude",
        "Survey Taken Place Longitude",
        "Survey Taken By",
        "Response Created Date",
      ]);

      // Get responses in batches to avoid memory issues with large datasets
      const BATCH_SIZE = 1000;
      let skip = 0;
      let allAttachments = new Set<string>();
      let fileInstructions = `SURVEY ${surveyId} ATTACHMENTS\n\n`;
      fileInstructions += `This Excel file contains links to attachment files in the 'attachments' folder.\n`;
      fileInstructions += `To access these files when clicked in Excel:\n`;
      fileInstructions += `1. Extract all files from the zip archive to a folder\n`;
      fileInstructions += `2. Keep the Excel file and attachments folder in the same directory\n`;
      fileInstructions += `3. When viewing in Excel, click on the file links to open them\n\n`;
      fileInstructions += `FILE LISTING:\n`;

      // Sort categories once
      const sortedCategories = [...survey.categories].sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );

      // Initialize category sheets
      for (const category of sortedCategories) {
        const categorySheet = workbook.addWorksheet(category.name);

        // Sort questions by orderNumber
        const sortedQuestions = [...category.questions].sort(
          (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
        );

        const header = ["Response ID", "Group ID"];
        sortedQuestions.forEach((question) =>
          header.push(question.description)
        );
        categorySheet.addRow(header);
      }

      // Process responses in batches
      let hasMoreResponses = true;

      while (hasMoreResponses) {
        const responses = await this.responseRepo.find({
          where: { survey: { id: Number(surveyId) } },
          relations: ["answers", "answers.question", "surveyTakenBy"],
          skip: skip,
          take: BATCH_SIZE,
        });

        if (responses.length === 0) {
          hasMoreResponses = false;
          continue;
        }

        // Process this batch of responses
        for (const response of responses) {
          // Add to response sheet
          responseSheet.addRow([
            response.id,
            response.googlePlusCode || "",
            response.houseLatitude || "",
            response.houseLongitude || "",
            response.surveyTakenPlaceLatitude || "",
            response.surveyTakenPlaceLongitude || "",
            `${response.surveyTakenBy.firstName} ${response.surveyTakenBy.lastName}` ||
              "N/A",
            response.createdAt || "N/A",
          ]);

          // Process each category for this response
          for (const category of sortedCategories) {
            const categorySheet: any = workbook.getWorksheet(category.name);

            // Sort questions by orderNumber
            const sortedQuestions = [...category.questions].sort(
              (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
            );

            const groupedAnswers = response.answers.filter((answer) =>
              category.questions.some(
                (question) => question.id === answer.question.id
              )
            );

            if (category.allowMultipleResponse) {
              const groupedByGroupId = groupedAnswers.reduce(
                (acc: any, answer) => {
                  acc[answer.groupId] = acc[answer.groupId] || [];
                  acc[answer.groupId].push(answer);
                  return acc;
                },
                {}
              );

              for (const groupId in groupedByGroupId) {
                const rowValues = [response.id, groupId];
                const row = categorySheet.addRow(rowValues);

                sortedQuestions.forEach((question, qIndex) => {
                  const answer = groupedByGroupId[groupId].find(
                    (a: any) => a.question.id === question.id
                  );

                  if (answer) {
                    if (["photo", "video", "pdf"].includes(question.type)) {
                      try {
                        const files = JSON.parse(answer.answer);
                        if (Array.isArray(files) && files.length > 0) {
                          // Add files to the attachments set
                          files.forEach((file) => {
                            allAttachments.add(file);
                            fileInstructions += `- ${file}\n`;
                            indexHtmlContent += `<li><a href="${file}">${file}</a></li>\n`;
                          });

                          // For Excel, we display the comma-separated list
                          const cellIndex = qIndex + 3; // +2 for ID and Group ID columns, +1 for 1-based indexing
                          const cell = row.getCell(cellIndex);

                          // Create a file that contains all these files for this specific answer
                          const answerFilename = `response_${response.id}_${question.id}_files.html`;
                          const answerHtmlPath = path.join(
                            attachmentsDir,
                            answerFilename
                          );

                          // Create HTML content with links to each file
                          let answerHtmlContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Files for Response ${response.id}, Question: ${question.description}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                h1 { color: #333; }
                                ul { list-style-type: none; padding: 0; }
                                li { margin: 10px 0; }
                                a { color: #0066cc; text-decoration: none; font-size: 16px; }
                                a:hover { text-decoration: underline; }
                              </style>
                            </head>
                            <body>
                              <h1>Files for Response ${response.id}</h1>
                              <h2>Question: ${question.description}</h2>
                              <ul>
                          `;

                          files.forEach((file) => {
                            answerHtmlContent += `<li><a href="./${file}">${file}</a></li>\n`;
                          });

                          answerHtmlContent += `
                              </ul>
                            </body>
                            </html>
                          `;

                          fs.writeFileSync(answerHtmlPath, answerHtmlContent);

                          // In Excel, set the cell value to the files list with hyperlink to our index
                          cell.value = {
                            text: files.join(", "),
                            hyperlink: `attachments/${answerFilename}`,
                            tooltip: `Click to view all ${files.length} files`,
                          };

                          // Style the hyperlink
                          cell.font = {
                            color: { argb: "0000FF" },
                            underline: true,
                          };
                        } else {
                          row.getCell(qIndex + 3).value = "No files";
                        }
                      } catch (e) {
                        row.getCell(qIndex + 3).value = answer.answer;
                      }
                    } else {
                      row.getCell(qIndex + 3).value = answer.answer;
                    }
                  } else {
                    row.getCell(qIndex + 3).value = "";
                  }
                });
              }
            } else {
              const rowValues = [response.id, ""];
              const row = categorySheet.addRow(rowValues);

              sortedQuestions.forEach((question, qIndex) => {
                const answer = groupedAnswers.find(
                  (a) => a.question.id === question.id
                );

                if (answer) {
                  if (["photo", "video", "pdf"].includes(question.type)) {
                    try {
                      const files = JSON.parse(answer.answer);
                      if (Array.isArray(files) && files.length > 0) {
                        // Add files to the attachments set
                        files.forEach((file) => {
                          allAttachments.add(file);
                          fileInstructions += `- ${file}\n`;
                          indexHtmlContent += `<li><a href="${file}">${file}</a></li>\n`;
                        });

                        // For Excel, we display the comma-separated list
                        const cellIndex = qIndex + 3; // +2 for ID and Group ID columns, +1 for 1-based indexing
                        const cell = row.getCell(cellIndex);

                        // Create a file that contains all these files for this specific answer
                        const answerFilename = `response_${response.id}_${question.id}_files.html`;
                        const answerHtmlPath = path.join(
                          attachmentsDir,
                          answerFilename
                        );

                        // Create HTML content with links to each file
                        let answerHtmlContent = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Files for Response ${response.id}, Question: ${question.description}</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; }
                              h1 { color: #333; }
                              ul { list-style-type: none; padding: 0; }
                              li { margin: 10px 0; }
                              a { color: #0066cc; text-decoration: none; font-size: 16px; }
                              a:hover { text-decoration: underline; }
                            </style>
                          </head>
                          <body>
                            <h1>Files for Response ${response.id}</h1>
                            <h2>Question: ${question.description}</h2>
                            <ul>
                        `;

                        files.forEach((file) => {
                          answerHtmlContent += `<li><a href="./${file}">${file}</a></li>\n`;
                        });

                        answerHtmlContent += `
                            </ul>
                          </body>
                          </html>
                        `;

                        fs.writeFileSync(answerHtmlPath, answerHtmlContent);

                        // In Excel, set the cell value to the files list with hyperlink to our index
                        cell.value = {
                          text: files.join(", "),
                          hyperlink: `attachments/${answerFilename}`,
                          tooltip: `Click to view all ${files.length} files`,
                        };

                        // Style the hyperlink
                        cell.font = {
                          color: { argb: "0000FF" },
                          underline: true,
                        };
                      } else {
                        row.getCell(qIndex + 3).value = "No files";
                      }
                    } catch (e) {
                      row.getCell(qIndex + 3).value = answer.answer;
                    }
                  } else {
                    row.getCell(qIndex + 3).value = answer.answer;
                  }
                } else {
                  row.getCell(qIndex + 3).value = "";
                }
              });
            }
          }
        }

        // Move to next batch
        skip += BATCH_SIZE;
      }

      // Finish the index.html content
      indexHtmlContent += `
          </ul>
        </body>
        </html>
      `;

      // Write the index.html file
      fs.writeFileSync(
        path.join(attachmentsDir, "index.html"),
        indexHtmlContent
      );

      // Write README.txt with instructions
      fs.writeFileSync(path.join(tempDir, "README.txt"), fileInstructions);

      // Save workbook to the temp directory
      const excelFilePath = path.join(
        tempDir,
        `survey_${surveyId}_responses.xlsx`
      );
      await workbook.xlsx.writeFile(excelFilePath);

      // Copy all attachment files to the attachments directory
      for (const file of allAttachments) {
        const sourcePath = path.join(uploadsDir, file);
        const destPath = path.join(attachmentsDir, file);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      // Add the Excel file to the root of the zip
      archive.file(excelFilePath, {
        name: `survey_${surveyId}_responses.xlsx`,
      });

      // Add the README.txt file to the zip
      archive.file(path.join(tempDir, "README.txt"), { name: "README.txt" });

      // Add the attachments directory to the zip
      archive.directory(attachmentsDir, "attachments");

      // Finalize the archive - this will stream the zip to the client
      await archive.finalize();

      // Clean up the temporary directory after the download is complete
      // We need to do this with a small delay to ensure the archive is fully written
      setTimeout(() => {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Error cleaning up temp directory:", cleanupError);
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      // If headers haven't been sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({
          message: "An error occurred while generating the Excel file.",
        });
      } else {
        // If headers have been sent, we can only end the response
        res.end();
      }
    }
  }
  async surveyTakenHousesGeojson(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const surveyId = req.params.surveyId;
      const wardId = req.query.ward; // Get the ward ID from the query

      // If wardId is missing, null, or empty, skip the boundary check
      let ward = null;
      if (wardId && wardId !== "") {
        // Fetch the ward boundary from the database only if wardId is provided
        ward = await this.wardRepo.findOne({
          where: { ward: Number(wardId) }, // Assuming ward is the identifier
        });

        if (!ward) {
          return next(new HttpError(404, "Ward not found."));
        }
      }

      // Fetch the responses for the specified surveyId
      const responses = await this.responseRepo.find({
        where: { survey: { id: Number(surveyId) } }, // Filter by surveyId
        relations: ["surveyTakenBy"], // Join with User to get the first name
      });

      const geoJsonFeatures = [];

      // Iterate over responses and create GeoJSON features
      for (let response of responses) {
        try {
          const googlePlusCode = response.googlePlusCode;

          if (googlePlusCode) {
            const decodedLocation = OpenLocationCode.decode(
              String(googlePlusCode)
            );
            const latitude = decodedLocation.latitudeCenter;
            const longitude = decodedLocation.longitudeCenter;

            // Prepare the point geometry for the response location
            const pointGeometry = `SRID=4326;POINT(${longitude} ${latitude})`; // WKT format for PostGIS

            // Query the House repository to find a match for the googlePlusCode
            const house = await this.houseRepo.findOne({
              where: { googlePlu: googlePlusCode },
            });

            const ogcFid = house ? house.ogcFid : null;

            // If ward is provided, check if the point intersects with the ward boundary
            if (ward) {
              // Use ST_Intersects to check if the house (point) intersects with the ward geometry
              const result = await this.wardRepo.query(
                `
                SELECT ST_Within(ST_GeomFromText($1, 4326), ST_GeomFromGeoJSON($2)) AS isWithin
                `,
                [pointGeometry, ward.geometry]
              );

              const isIntersecting = result[0]?.iswithin ?? false;

              if (isIntersecting) {
                // Prepare GeoJSON feature for this response
                const geoJsonFeature = {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    surveyId,
                    responseId: response.id,
                    googlePlusCode,
                    ogcFid, // Include the ogcFid if a house is matched
                    firstName: response.surveyTakenBy.firstName, // Add first name from the surveyTakenBy user relation
                  },
                };

                geoJsonFeatures.push(geoJsonFeature);
              }
            } else {
              // If ward is not provided, include all responses without boundary check
              const geoJsonFeature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                properties: {
                  surveyId,
                  responseId: response.id,
                  googlePlusCode,
                  ogcFid, // Include the ogcFid if a house is matched
                  surveyTakenBy: response.surveyTakenBy.firstName, // Add first name from the surveyTakenBy user relation
                },
              };

              geoJsonFeatures.push(geoJsonFeature);
            }
          } else if (
            response.houseLatitude != null &&
            response.houseLongitude != null
          ) {
            const latitude = response.houseLatitude;
            const longitude = response.houseLongitude;

            // Prepare the point geometry for the response location
            const pointGeometry = `SRID=4326;POINT(${longitude} ${latitude})`; // WKT format for PostGIS

            // If ward is provided, check if the point intersects with the ward boundary
            if (ward) {
              // Use ST_Intersects to check if the house (point) intersects with the ward geometry
              const result = await this.wardRepo.query(
                `
                  SELECT ST_Within(ST_GeomFromText($1, 4326), ST_GeomFromGeoJSON($2)) AS isWithin
                  `,
                [pointGeometry, ward.geometry]
              );

              const isIntersecting = result[0]?.iswithin ?? false;

              if (isIntersecting) {
                // Prepare GeoJSON feature for this response
                const geoJsonFeature = {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    surveyId,
                    responseId: response.id,
                    surveyTakenBy: response.surveyTakenBy.firstName, // Add first name from the surveyTakenBy user relation
                  },
                };

                geoJsonFeatures.push(geoJsonFeature);
              }
            } else {
              // If ward is not provided, include all responses without boundary check
              const geoJsonFeature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                properties: {
                  surveyId,
                  responseId: response.id,
                  surveyTakenBy: response.surveyTakenBy.firstName, // Add first name from the surveyTakenBy user relation
                },
              };

              geoJsonFeatures.push(geoJsonFeature);
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Wrap in GeoJSON format
      const geoJson = {
        type: "FeatureCollection",
        features: geoJsonFeatures,
      };

      // Return the generated GeoJSON
      return res.json({
        data: { geoJson, totalCount: geoJson?.features?.length ?? 0 },
        status: 200,
        success: true,
        message: "Survey Taken House geojson retrieved successfully.",
      });
    } catch (error) {
      console.log(error);
      next(new HttpError(500, "Failed to generate GeoJSON."));
    }
  }

  // Method to generate GeoJSON for houses whose Google Plus Code is missing in the survey responses
  async missingGooglePlusCodeGeojson(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const surveyId = req.params.surveyId;
      const wardId = req.query.ward; // Get the ward ID from the query

      // Step 1: Fetch the ward boundary if wardId is provided
      let ward = null;
      if (wardId && wardId !== "") {
        ward = await this.wardRepo.findOne({
          where: { ward: Number(wardId) }, // Assuming ward is the identifier
        });

        if (!ward) {
          return next(new HttpError(404, "Ward not found."));
        }
      }

      // Step 2: Fetch all survey responses for the given surveyId
      const surveyResponses = await this.responseRepo.find({
        where: { survey: { id: Number(surveyId) } },
      });

      // Step 3: Get the list of Google Plus Codes present in the responses
      const existingGooglePlusCodes = surveyResponses.map(
        (response) => response.googlePlusCode
      );

      // Step 4: Query the houses
      let houseQuery = this.houseRepo
        .createQueryBuilder("house")
        .where("house.googlePlu IS NOT NULL AND house.googlePlu != ''");

      // Add the NOT IN clause only if there are existing Google Plus Codes
      if (existingGooglePlusCodes.length > 0) {
        houseQuery = houseQuery.andWhere(
          "house.googlePlu NOT IN (:...existingGooglePlusCodes)",
          { existingGooglePlusCodes }
        );
      }

      // Step 5: If a ward is provided, filter houses by ward boundary using ST_Within
      if (ward) {
        houseQuery = houseQuery.andWhere(
          "ST_Within(house.wkb_geometry, ST_GeomFromGeoJSON(:wardGeometry))",
          {
            wardGeometry: ward.geometry,
          }
        );
      }

      // Execute the query and get houses
      const houses = await houseQuery
        .addSelect("ST_AsGeoJSON(house.wkb_geometry)", "geojson")
        .getRawMany();

      // Step 6: Convert the house data to GeoJSON format
      const geoJson = {
        type: "FeatureCollection",
        features: houses.map((house) => ({
          type: "Feature",
          geometry: JSON.parse(house.geojson), // Geometry is already in GeoJSON format
          properties: {
            ogcFid: house.house_ogc_fid,
            owner: house.house_owner,
            tole: house.house_tole,
            house_code: house.house_house_code,
            googleplu: house.house_googlePlu,
            ward: house.house_ward,
          },
        })),
      };

      // Return the generated GeoJSON
      return res.json({
        data: { geoJson, totalCount: geoJson?.features?.length ?? 0 },
        status: 200,
        success: true,
        message: "Survey Not Taken House geojson retrieved successfully.",
      });
    } catch (error) {
      console.log(error);
      next(
        new HttpError(
          500,
          "Failed to generate GeoJSON for houses missing in the response records."
        )
      );
    }
  }

  async getSurveyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = Number(req.params.surveyId);
      if (isNaN(surveyId)) {
        return next(new HttpError(400, "Invalid survey ID."));
      }
      const survey = await this.surveyRepo.findOneBy({ id: surveyId });
      if (!survey) {
        throw new HttpError(404, "Survey Not Found");
      }

      // Fetch all survey responses for the given survey ID
      const responses = await this.responseRepo.find({
        where: { survey: { id: surveyId } },
        relations: ["surveyTakenBy"],
      });

      // Fetch all houses
      const houses = await this.houseRepo.find(); // Assumes houseRepo is initialized in the controller

      const totalHouses = houses.length;
      const totalResponses = responses.length;

      // Count mappable responses
      const mappableResponses = responses.filter((response) => {
        try {
          if (response.googlePlusCode) {
            OpenLocationCode.decode(String(response.googlePlusCode));
            return true;
          } else if (
            response.houseLatitude != null &&
            response.houseLongitude != null
          ) {
            return true;
          }
        } catch {
          return false;
        }
      }).length;

      // Map responses by Google Plus Code
      const responseGoogleCodes = new Set(
        responses.map((response) => response.googlePlusCode)
      );

      // Calculate total houses that didn't submit a response
      const nonResponsiveHouses = houses.filter(
        (house) => house.googlePlu && !responseGoogleCodes.has(house.googlePlu)
      );
      const totalNonResponsiveHouses = nonResponsiveHouses.length;

      // Ward-wise calculations
      const wardWiseStats = houses.reduce((acc, house) => {
        if (!house.ward) return acc; // Skip houses without ward info
        if (!acc[house.ward]) {
          acc[house.ward] = {
            totalHouses: 0,
            nonResponsiveHouses: 0,
            completionPercentage: 0,
          };
        }

        acc[house.ward].totalHouses++;

        if (!house.googlePlu || !responseGoogleCodes.has(house.googlePlu)) {
          acc[house.ward].nonResponsiveHouses++;
        }

        acc[house.ward].completionPercentage =
          ((acc[house.ward].totalHouses - acc[house.ward].nonResponsiveHouses) /
            acc[house.ward].totalHouses) *
          100;

        return acc;
      }, {} as Record<string, { totalHouses: number; nonResponsiveHouses: number; completionPercentage: number }>);

      // Overall completion percentage
      const overallCompletionPercentage =
        ((totalHouses - totalNonResponsiveHouses) / totalHouses) * 100;

      // Group responses by user and count
      const userResponseCounts: Record<number, { user: User; count: number }> =
        responses.reduce((acc, response) => {
          const userId = response.surveyTakenBy?.id;
          if (userId) {
            if (!acc[userId]) {
              acc[userId] = { user: response.surveyTakenBy, count: 0 };
            }
            acc[userId].count++;
          }
          return acc;
        }, {} as Record<number, { user: User; count: number }>);

      // Sort by response count
      const topUsers: TopUser[] = Object.values(userResponseCounts)
        .sort((a, b) => b.count - a.count)

        .map((entry) => ({
          userId: entry.user.id,
          userName: `${entry.user.firstName} ${entry.user.lastName}`,
          responseCount: entry.count,
        }));

      // Return stats
      return res.json({
        data: {
          surveyName: survey.name,
          surveyDescription: survey.description,
          surveyCode: survey.code,
          surveyStatus: survey.isActive,
          totalResponses,
          mappableResponses,
          totalHouses,
          totalNonResponsiveHouses,
          overallCompletionPercentage: overallCompletionPercentage.toFixed(2),
          wardWiseStats,
          topUsers,
        },
        status: 200,
        success: true,
        message: "Survey statistics retrieved successfully.",
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getSurveyors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { surveyId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const search = req.query.search as string;

      // Verify survey exists
      const survey = await this.surveyRepo.findOne({
        where: { id: Number(surveyId) },
      });

      if (!survey) {
        throw new HttpError(404, "Survey not found");
      }

      // Create query builder starting from User entity
      const queryBuilder = this.userRepo
        .createQueryBuilder("user")
        .leftJoin("user.responses", "response")
        .leftJoin("response.survey", "survey")
        .where("survey.id = :surveyId", { surveyId });

      // Add search conditions if search query is provided
      if (search) {
        queryBuilder.andWhere(
          "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Make the query distinct to avoid duplicate users
      queryBuilder.distinct(true);

      // Get total count for pagination
      const totalItems = await queryBuilder.getCount();

      // Add pagination and ordering
      const surveyors = await queryBuilder
        .orderBy("user.createdAt", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();
      const serialOffset = (page - 1) * pageSize;
      // Get response counts for each surveyor
      const surveyorsWithStats = await Promise.all(
        surveyors.map(async (surveyor, index) => {
          const responseCount = await this.responseRepo.count({
            where: {
              survey: { id: Number(surveyId) },
              surveyTakenBy: { id: surveyor.id },
            },
          });

          const latestResponse = await this.responseRepo.findOne({
            where: {
              survey: { id: Number(surveyId) },
              surveyTakenBy: { id: surveyor.id },
            },
            order: { createdAt: "DESC" },
          });

          return {
            SN: serialOffset + index + 1,
            id: surveyor.id,
            firstName: surveyor.firstName,
            lastName: surveyor.lastName,
            email: surveyor.email,
            phone: surveyor.phone,
            responseCount,
            lastResponseDate: latestResponse?.createdAt || null,
          };
        })
      );

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Surveyors retrieved successfully.",
        data: surveyorsWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllResponsesTakenByAUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const surveyId = parseInt(req.params.surveyId, 10); // Convert surveyId to a number
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const userId = parseInt(req.params.userId, 10); // Convert surveyId to a number

      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new HttpError(400, "User doesn't exist.");
      }
      // Find responses for the specified surveyId with pagination
      const [responses, totalItems] = await this.responseRepo.findAndCount({
        where: {
          survey: { id: surveyId },
          surveyTakenBy: { id: userId },
        },
        order: {
          createdAt: "DESC",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Add S.N to each response
      const serialOffset = (page - 1) * pageSize;
      const responsesWithSN = responses.map((response, index) => {
        const { createdAt, updatedAt, modifiedBy, ...rest } = response; // Exclude unwanted fields
        return {
          SN: serialOffset + index + 1, // Calculate serial number based on current page
          ...rest,
        };
      });
      // Pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      res.status(200).json({
        success: true,
        message: `Responses for survey ID: ${surveyId} retrieved successfully.`,
        data: {
          user: {
            name: (user.firstName ?? "N/A") + " " + (user.lastName ?? "N/A"),
            id: user.id,
          },
          data: responsesWithSN,
        },
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllResponsesTakenByOneSelf(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const surveyId = parseInt(req.params.surveyId, 10); // Convert surveyId to a number
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const userId = parseInt(req.user.id, 10); 

      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new HttpError(400, "User doesn't exist.");
      }
      // Find responses for the specified surveyId with pagination
      const [responses, totalItems] = await this.responseRepo.findAndCount({
        where: {
          survey: { id: surveyId },
          surveyTakenBy: { id: userId },
        },
        order: {
          createdAt: "DESC",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Add S.N to each response
      const serialOffset = (page - 1) * pageSize;
      const responsesWithSN = responses.map((response, index) => {
        const { createdAt, updatedAt, modifiedBy, ...rest } = response; // Exclude unwanted fields
        return {
          SN: serialOffset + index + 1, // Calculate serial number based on current page
          ...rest,
        };
      });
      // Pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      res.status(200).json({
        success: true,
        message: `Responses for survey ID: ${surveyId} retrieved successfully.`,
        data: responsesWithSN,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async surveyTakenByOneselfHousesGeojson(
    req: any,
    res: Response,
    next: NextFunction
  ) {
    try {
      const surveyId = req.params.surveyId;
      const wardId = req.query.ward; // Get the ward ID from the query
      const userId = parseInt(req.user.id, 10); 

      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new HttpError(400, "User doesn't exist.");
      }

      // If wardId is missing, null, or empty, skip the boundary check
      let ward = null;
      if (wardId && wardId !== "") {
        // Fetch the ward boundary from the database only if wardId is provided
        ward = await this.wardRepo.findOne({
          where: { ward: Number(wardId) }, // Assuming ward is the identifier
        });

        if (!ward) {
          return next(new HttpError(404, "Ward not found."));
        }
      }

      // Fetch the responses for the specified surveyId
      const responses = await this.responseRepo.find({
        where: { survey: { id: Number(surveyId) },  surveyTakenBy: { id: userId }, }, // Filter by surveyId
        relations: ["surveyTakenBy"], // Join with User to get the first name
      });

      const geoJsonFeatures = [];

      // Iterate over responses and create GeoJSON features
      for (let response of responses) {
        try {
          const googlePlusCode = response.googlePlusCode;

          if (googlePlusCode) {
            const decodedLocation = OpenLocationCode.decode(
              String(googlePlusCode)
            );
            const latitude = decodedLocation.latitudeCenter;
            const longitude = decodedLocation.longitudeCenter;

            // Prepare the point geometry for the response location
            const pointGeometry = `SRID=4326;POINT(${longitude} ${latitude})`; // WKT format for PostGIS

            // Query the House repository to find a match for the googlePlusCode
            const house = await this.houseRepo.findOne({
              where: { googlePlu: googlePlusCode },
            });

            const ogcFid = house ? house.ogcFid : null;

            // If ward is provided, check if the point intersects with the ward boundary
            if (ward) {
              // Use ST_Intersects to check if the house (point) intersects with the ward geometry
              const result = await this.wardRepo.query(
                `
                SELECT ST_Within(ST_GeomFromText($1, 4326), ST_GeomFromGeoJSON($2)) AS isWithin
                `,
                [pointGeometry, ward.geometry]
              );

              const isIntersecting = result[0]?.iswithin ?? false;

              if (isIntersecting) {
                // Prepare GeoJSON feature for this response
                const geoJsonFeature = {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    responseId: response.id,
                    googlePlusCode,
                    houseOgcFid:ogcFid, // Include the ogcFid if a house is matched
                    houseLongitude:decodedLocation.longitudeCenter,
                    houseLatitude:decodedLocation.latitudeCenter,
                    dateOfCollection:response.createdAt,
                  },
                };

                geoJsonFeatures.push(geoJsonFeature);
              }
            } else {
              // If ward is not provided, include all responses without boundary check
              const geoJsonFeature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                properties: {
                  responseId: response.id,
                    googlePlusCode,
                    houseOgcFid:ogcFid, // Include the ogcFid if a house is matched
                    houseLongitude:decodedLocation.longitudeCenter,
                    houseLatitude:decodedLocation.latitudeCenter,
                    dateOfCollection:response.createdAt,
                },
              };

              geoJsonFeatures.push(geoJsonFeature);
            }
          } else if (
            response.houseLatitude != null &&
            response.houseLongitude != null
          ) {
            const latitude = response.houseLatitude;
            const longitude = response.houseLongitude;

            // Prepare the point geometry for the response location
            const pointGeometry = `SRID=4326;POINT(${longitude} ${latitude})`; // WKT format for PostGIS

            // If ward is provided, check if the point intersects with the ward boundary
            if (ward) {
              // Use ST_Intersects to check if the house (point) intersects with the ward geometry
              const result = await this.wardRepo.query(
                `
                  SELECT ST_Within(ST_GeomFromText($1, 4326), ST_GeomFromGeoJSON($2)) AS isWithin
                  `,
                [pointGeometry, ward.geometry]
              );

              const isIntersecting = result[0]?.iswithin ?? false;

              if (isIntersecting) {
                // Prepare GeoJSON feature for this response
                const geoJsonFeature = {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    responseId: response.id,
                    googlePlusCode,
                    houseLongitude:response.houseLongitude,
                    houseLatitude:response.houseLatitude,
                    dateOfCollection:response.createdAt,
                  },
                };

                geoJsonFeatures.push(geoJsonFeature);
              }
            } else {
              // If ward is not provided, include all responses without boundary check
              const geoJsonFeature = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                properties: {
                  responseId: response.id,
                  googlePlusCode,
                  houseLongitude:response.houseLongitude,
                  houseLatitude:response.houseLatitude,
                  dateOfCollection:response.createdAt,
                },
              };

              geoJsonFeatures.push(geoJsonFeature);
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Wrap in GeoJSON format
      const geoJson = {
        type: "FeatureCollection",
        features: geoJsonFeatures,
      };

      // Return the generated GeoJSON
      return res.json({
        data: { geoJson, totalCount: geoJson?.features?.length ?? 0 },
        status: 200,
        success: true,
        message: "Survey Taken House geojson retrieved successfully.",
      });
    } catch (error) {
      console.log(error);
      next(new HttpError(500, "Failed to generate GeoJSON."));
    }
  }


  async getResponseByIdForSelfCollectedResponse(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const userId = parseInt(req.user.id, 10);

      // Validate ID
      if (!id || isNaN(Number(id))) {
        console.error(`Invalid ID parameter: ${id}`);
        return res.status(400).json({
          success: false,
          message: "Invalid ID parameter provided.",
        });
      }

      // Find response by ID with relations and ordering
      const response = await this.responseRepo.findOne({
        where: { id: Number(id) },
        relations: [
          "answers",
          "answers.question",
          "answers.question.options",
          "answers.question.categories",
          "surveyTakenBy",
        ],
        order: {
          answers: {
            question: {
              categories: {
                orderNumber: "ASC",
              },
              orderNumber: "ASC",
            },
          },
        },
      });

      if (!response) {
        console.error(`Response not found for ID: ${id}`);
        throw new HttpError(404, "Response not found");
      }

      const user = response.surveyTakenBy;

      if (!user) {
        console.warn(
          `User not found for surveyTakenBy ID: ${response.surveyTakenBy?.id}`
        );
      }

      if(userId != user.id)
      {
        throw new HttpError(401, "You are not authorized to view this response.")
      }

      // Create a map to store sorted questions by category
      const categoryMap: Record<
        number,
        {
          categoryId: number;
          categoryName: string;
          orderNumber: number;
          answers: Record<string, any[]>;
        }
      > = {};

      // First, collect all categories with their order numbers
      response.answers.forEach((answer) => {
        const question = answer.question;
        const categories = question?.categories || [];

        categories.forEach((category) => {
          if (!categoryMap[category.id]) {
            categoryMap[category.id] = {
              categoryId: category.id,
              categoryName: category.name,
              orderNumber: category.orderNumber,
              answers: {},
            };
          }
        });
      });

      // Then process answers and organize them by category and group
      response.answers.forEach((answer) => {
        const question = answer.question;
        const categories = question?.categories || [];

        categories.forEach((category) => {
          const groupId = answer.groupId || "ungrouped";
          if (!categoryMap[category.id].answers[groupId]) {
            categoryMap[category.id].answers[groupId] = [];
          }

          // Sort options by orderNumber before adding to the answer
          const sortedOptions = (question?.options || []).sort(
            (a, b) => a.orderNumber - b.orderNumber
          );

          categoryMap[category.id].answers[groupId].push({
            questionId: question?.id,
            questionOrderNumber: question?.orderNumber,
            answer: answer.answer,
            question: {
              description: question?.description || "",
              type: question?.type || "",
              options: sortedOptions.map((option) => ({
                id: option.id,
                value: option.value,
                orderNumber: option.orderNumber,
              })),
            },
          });
        });
      });

      // Sort categories by orderNumber
      const sortedCategories = Object.values(categoryMap).sort(
        (a, b) => a.orderNumber - b.orderNumber
      );

      // Sort answers within each group by question orderNumber
      sortedCategories.forEach((category) => {
        Object.keys(category.answers).forEach((groupId) => {
          category.answers[groupId].sort(
            (a, b) => a.questionOrderNumber - b.questionOrderNumber
          );
        });
      });

      // Format the final response
      const formattedResponse = {
        googlePlusCode: response?.googlePlusCode,
        surveyId: response.survey?.id,
        surveyTakenById: response.surveyTakenBy?.id,
        surveyTakenPlaceLongitude: Number(response?.surveyTakenPlaceLongitude),
        surveyTakenPlaceLatitude: Number(response?.surveyTakenPlaceLatitude),
        houseLongitude: Number(response?.houseLongitude),
        houseLatitude: Number(response?.houseLatitude),
        surveyTakenByName: user
          ? `${user.firstName} ${user.lastName}`
          : "Unknown User",
        categories: sortedCategories.map((category) => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          orderNumber: category.orderNumber,
          answers: Object.entries(category.answers).map(
            ([groupId, answers]) => ({
              groupId,
              answers,
            })
          ),
        })),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      res.status(200).json({
        success: true,
        message: `Response with id: ${id} retrieved successfully.`,
        data: formattedResponse,
      });
    } catch (error) {
      console.error("Error retrieving response:", error);
      if (error instanceof HttpError) {
        return next(error);
      }
      next(new HttpError(500, "Something went wrong"));
    }
  }
  
}

export default new ResponseController();
