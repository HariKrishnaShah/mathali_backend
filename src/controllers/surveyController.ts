import { AppDataSource } from "../config/database";
import { Survey } from "../entities/survey/Survey";
import { Category } from "../entities/survey/Category";
import { Question } from "../entities/survey/Question";
import { Option } from "../entities/survey/Option";
import { DataSource, DeepPartial } from "typeorm";
import HttpError from "../util/httpError";
import { NextFunction, Request, Response } from "express";
import { Response as ResponseEntity } from "../entities/survey/Response";
import PDFDocument from "pdfkit";
import path from "path";
import { User } from "../entities/user/User";
// Define types for request body
interface ICreateQuestionDTO {
  type: "text" | "multiple_choice" | "multiple_select" | "single_choice";
  description: string;
  isRequired: boolean;
  options?: { value: string }[];
  mappingEntity: string | null;
  mappingAttribute: string | null;
}
interface IUpdateSurveyDTO {
  name?: string;
  isActive?: boolean;
  description: string;
  code?: string;
  defaultIdentifier?: string;
}

interface ICreateCategoryDTO {
  id?: number; // Optional for existing categories
  name?: string; // Required for new categories
  questions?: ICreateQuestionDTO[]; // Optional for new categories
  allowMultipleResponse: boolean;
}

interface ICreateSurveyDTO {
  name: string;
  description: string;
  isActive: boolean;
  code: string;
  categories: ICreateCategoryDTO[];
}

class SurveyController {
  constructor(
     private userRepo = AppDataSource.getRepository(User),
    private surveyRepo = AppDataSource.getRepository(Survey),
    private categoryRepo = AppDataSource.getRepository(Category),
    private questionRepo = AppDataSource.getRepository(Question),
    private optionRepo = AppDataSource.getRepository(Option),
    private responseRepo = AppDataSource.getRepository(ResponseEntity),
  ) {}

  async create(req: Request, res: Response, next: NextFunction) {
    const data: any = req.body;
    try {
      console.log(req.body);
      // Create Survey
      const surveyData: DeepPartial<Survey> = {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? false,
        code: data.code,
        defaultIdentifier: data.defaultIdentifier,
        isDefault:
          data?.defaultIdentifier == null || data?.defaultIdentifier == ""
            ? false
            : true,
      };

      const survey = this.surveyRepo.create(surveyData);
      const savedSurvey = await this.surveyRepo.save(survey);

      // Process Categories
      const categories = await Promise.all(
        data.categories.map(
          async (categoryData: any, categoryIndex: number) => {
            // Create a new category and assign order number
            const newCategory = this.categoryRepo.create({
              name: categoryData.name,
              allowMultipleResponse: categoryData.allowMultipleResponse,
              orderNumber: categoryIndex + 1, // Assign order number
              questions: await Promise.all(
                categoryData.questions.map(
                  async (questionData: any, questionIndex: number) => {
                    if (questionData.id) {
                      // Reuse existing question by ID
                      const existingQuestion = await this.questionRepo.findOne({
                        where: { id: questionData.id },
                        relations: ["options"],
                      });

                      if (!existingQuestion) {
                        throw new HttpError(
                          404,
                          `Question with id ${questionData.id} not found.`
                        );
                      }

                      return existingQuestion;
                    } else {
                      // Create a new question and assign order number
                      const newQuestion = this.questionRepo.create({
                        type: questionData.type,
                        isRequired: questionData.isRequired,
                        description: questionData.description,
                        orderNumber: questionIndex + 1, // Assign order number
                        mappingEntity: questionData?.mappingEntity ?? null,
                        mappingAttribute:
                          questionData?.mappingAttribute ?? null,
                        options: questionData.options
                          ? questionData.options.map(
                              (option: any, optionIndex: number) => ({
                                value: option.value,
                                orderNumber: optionIndex + 1, // Assign order number
                              })
                            )
                          : [],
                      });

                      return newQuestion;
                    }
                  }
                )
              ),
            });

            return newCategory;
          }
        )
      );

      // Save new categories and associate them with the survey
      const savedCategories = await this.categoryRepo.save(categories);
      savedSurvey.categories = savedCategories;
      await this.surveyRepo.save(savedSurvey);

      // Prepare the response with full survey details, including categories and questions
      const createdSurvey = await this.surveyRepo.findOne({
        where: { id: savedSurvey.id },
        relations: [
          "categories",
          "categories.questions",
          "categories.questions.options",
        ],
      });

      // Return the successful response
      return res.status(201).json({
        status: 200,
        success: true,
        message: "Survey created successfully",
        data: { id: createdSurvey?.id },
      });
    } catch (error) {
      console.error("Error creating survey: ", error);
      next(error);
    }
  }
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any | null> {
    try {
      const idParsed = Number(req.params.id);

      // Find the survey with relations and order by orderNumber
      const survey = await this.surveyRepo.findOne({
        where: { id: idParsed },
        relations: {
          categories: {
            questions: {
              options: true,
            },
          },
        },
        order: {
          categories: {
            orderNumber: "ASC",
            questions: {
              orderNumber: "ASC",
              options: {
                orderNumber: "ASC",
              },
            },
          },
        },
      });

      // Remove the fields from survey and related entities
      const removeFields = (obj: any) => {
        delete obj.createdAt;
        delete obj.updatedAt;
        delete obj.modifiedBy;

        if (obj.categories) {
          obj.categories.forEach((category: any) => {
            delete category.createdAt;
            delete category.updatedAt;
            delete category.modifiedBy;

            if (category.questions) {
              category.questions.forEach((question: any) => {
                delete question.createdAt;
                delete question.updatedAt;
                delete question.modifiedBy;

                if (question.options) {
                  question.options.forEach((option: any) => {
                    delete option.createdAt;
                    delete option.updatedAt;
                    delete option.modifiedBy;
                  });
                }
              });
            }
          });
        }
      };

      // Ensure survey exists
      if (!survey) {
        throw new HttpError(404, `Survey with id ${idParsed} not found`);
      }

      removeFields(survey);

      return res.status(200).json({
        status: 200,
        success: true,
        message: `Survey with id: ${idParsed} has been retrieved successfully.`,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdForIntro(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any | null> {
    try {
      const idParsed = Number(req.params.id);

      // Find the survey with relations and order by orderNumber
      const survey = await this.surveyRepo.findOne({
        where: { id: idParsed },
      });

      // Remove the fields from survey and related entities
      const removeFields = (obj: any) => {
        delete obj.createdAt;
        delete obj.updatedAt;
        delete obj.modifiedBy;
      };

      // Ensure survey exists
      if (!survey) {
        throw new HttpError(404, `Survey with id ${idParsed} not found`);
      }

      removeFields(survey);

      return res.status(200).json({
        status: 200,
        success: true,
        message: `Survey with id: ${idParsed} has been retrieved successfully.`,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  //get survey details with id for editing purpose
  async getByIdForEditing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any | null> {
    try {
      const idParsed = Number(req.params.id);

      // Find the survey with relations (categories, questions, options)
      const survey = await this.surveyRepo.findOne({
        where: { id: idParsed },
        relations: {
          categories: {
            questions: {
              options: true,
            },
          },
        },
        order: {
          categories: {
            orderNumber: "ASC",
            questions: {
              orderNumber: "ASC",
              options: {
                orderNumber: "ASC",
              },
            },
          },
        },
      });

      if (!survey) {
        throw new HttpError(404, `Survey with id ${idParsed} not found`);
      }

      // Remove the fields from survey and related entities
      const removeFields = (obj: any) => {
        delete obj.createdAt;
        delete obj.updatedAt;
        delete obj.modifiedBy;
        // delete obj.id;

        if (obj.categories) {
          obj.categories.forEach((category: any) => {
            delete category.createdAt;
            delete category.updatedAt;
            delete category.modifiedBy;
            // delete category.id;

            if (category.questions) {
              category.questions.forEach((question: any) => {
                delete question.createdAt;
                delete question.updatedAt;
                delete question.modifiedBy;
                // delete question.id;

                if (question.options) {
                  question.options.forEach((option: any) => {
                    delete option.createdAt;
                    delete option.updatedAt;
                    delete option.modifiedBy;
                    // delete option.id;
                  });
                }
              });
            }
          });
        }
      };

      removeFields(survey);

      return res.status(200).json({
        status: 200,
        success: true,
        message: `Survey with id: ${idParsed} has been retrieved successfully.`,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }
  // Update a survey (name and isActive only)
  async updateSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updateData: IUpdateSurveyDTO = req.body;

      // Check if the survey exists
      const existingSurvey = await this.surveyRepo.findOne({ where: { id } });
      if (!existingSurvey) {
        throw new HttpError(404, `Survey with ID ${id} not found`);
      }

      // Update fields
      if (updateData.name !== undefined) {
        existingSurvey.name = updateData.name;
      }
      if (updateData.isActive !== undefined) {
        existingSurvey.isActive = updateData.isActive;
      }
      if (updateData.description !== undefined) {
        existingSurvey.description = updateData.description;
      }
      if (updateData.code !== undefined) {
        existingSurvey.code = updateData.code;
      }
      if (updateData.defaultIdentifier !== undefined) {
        existingSurvey.defaultIdentifier = updateData.defaultIdentifier;
      }

      // Save the updated survey
      const updatedSurvey = await this.surveyRepo.save(existingSurvey);

      return res.status(200).json({
        success: true,
        message: "Survey updated successfully",
        data: updatedSurvey,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a survey and its associated entities
  async deleteSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      // Find the survey with relations
      const survey = await this.surveyRepo.findOne({
        where: { id },
        relations: {
          categories: {
            questions: {
              options: true,
            },
          },
          responses: {
            answers: true,
          },
        },
      });

      if (!survey) {
        throw new HttpError(404, `Survey with ID ${id} not found`);
      }
      if (survey.isDefault) {
        throw new HttpError(
          404,
          `Survey with ID ${id} is default survey. Can't Delete it.`
        );
      }

      // Remove the survey (triggers cascade deletions)
      await this.surveyRepo.remove(survey);

      return res.status(200).json({
        success: true,
        message: "Survey deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // New method to update survey categories and questions
  async updateSurveyCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const surveyId = Number(req.params.id);
      const newCategoriesData = req.body.categories;

      // Validate input
      if (!Array.isArray(newCategoriesData)) {
        throw new HttpError(400, "Invalid categories data.");
      }

      // Check if the survey exists
      const existingSurvey = await this.surveyRepo.findOne({
        where: { id: surveyId },
        relations: { categories: { questions: { options: true } } },
      });

      if (!existingSurvey) {
        throw new HttpError(404, `Survey with ID ${surveyId} not found.`);
      }

      if (existingSurvey.isActive) {
        throw new HttpError(
          403,
          `Survey with ID ${surveyId} is active. Updates are not allowed.`
        );
      }

      // if (existingSurvey.isDefault) {
      //   throw new HttpError(
      //     404,
      //     `Survey with ID ${surveyId} is default survey. Can't Delete it.`
      //   );
      // }

      // Keep track of processed entities to handle deletions
      const processedCategoryIds = new Set<number>();
      const processedQuestionIds = new Set<number>();
      const processedOptionIds = new Set<number>();

      // Process and update/create categories
      const updatedCategories = await Promise.all(
        newCategoriesData.map(async (categoryData, categoryIndex) => {
          let category;

          if (categoryData.id) {
            // Update existing category
            category = existingSurvey.categories.find(
              (c) => c.id === categoryData.id
            );
            if (category) {
              category.name = categoryData.name;
              category.allowMultipleResponse =
                categoryData.allowMultipleResponse;
              category.orderNumber = categoryIndex + 1;
              processedCategoryIds.add(category.id);
            }
          }

          if (!category) {
            // Create new category
            category = this.categoryRepo.create({
              name: categoryData.name,
              allowMultipleResponse: categoryData.allowMultipleResponse,
              orderNumber: categoryIndex + 1,
              surveys: [existingSurvey],
            });
          }

          const savedCategory = await this.categoryRepo.save(category);

          // Process questions for the category
          const questions = await Promise.all(
            (categoryData.questions || []).map(
              async (questionData: any, questionIndex: any) => {
                let question;

                if (questionData.id) {
                  // Update existing question
                  question = category.questions?.find(
                    (q: any) => q.id === questionData.id
                  );
                  if (question) {
                    question.type = questionData.type;
                    question.description = questionData.description;
                    question.isRequired = questionData.isRequired;
                    question.orderNumber = questionIndex + 1;
                    processedQuestionIds.add(question.id);
                  }
                }

                if (!question) {
                  // Create new question
                  question = this.questionRepo.create({
                    type: questionData.type,
                    description: questionData.description,
                    isRequired: questionData.isRequired,
                    orderNumber: questionIndex + 1,
                    categories: [savedCategory],
                  });
                }

                const savedQuestion = await this.questionRepo.save(question);

                // Process options for the question
                if (Array.isArray(questionData.options)) {
                  const options = await Promise.all(
                    questionData.options.map(
                      async (optionData: any, optionIndex: any) => {
                        let option;

                        if (optionData.id) {
                          // Update existing option
                          option = question.options?.find(
                            (o: any) => o.id === optionData.id
                          );
                          if (option) {
                            option.value = optionData.value;
                            option.orderNumber = optionIndex + 1;
                            processedOptionIds.add(option.id);
                          }
                        }

                        if (!option) {
                          // Create new option
                          option = this.optionRepo.create({
                            value: optionData.value,
                            orderNumber: optionIndex + 1,
                            question: savedQuestion,
                          });
                        }

                        return this.optionRepo.save(option);
                      }
                    )
                  );

                  // Remove options that weren't in the update
                  if (question.options) {
                    const optionsToRemove = question.options.filter(
                      (option: any) => !processedOptionIds.has(option.id)
                    );
                    await this.optionRepo.remove(optionsToRemove);
                  }

                  savedQuestion.options = options;
                }

                return savedQuestion;
              }
            )
          );

          // Remove questions that weren't in the update
          if (category.questions) {
            const questionsToRemove = category.questions.filter(
              (question) => !processedQuestionIds.has(question.id)
            );
            await this.questionRepo.remove(questionsToRemove);
          }

          savedCategory.questions = questions;
          return savedCategory;
        })
      );

      // Remove categories that weren't in the update
      const categoriesToRemove = existingSurvey.categories.filter(
        (category) => !processedCategoryIds.has(category.id)
      );
      await this.categoryRepo.remove(categoriesToRemove);

      // Update survey categories
      existingSurvey.categories = updatedCategories;
      await this.surveyRepo.save(existingSurvey);

      // Return success response
      return res.status(200).json({
        success: true,
        message: "Survey categories and questions updated successfully.",
      });
    } catch (error) {
      console.error("Error updating survey categories: ", error);
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;

      // Extract query parameters for filtering
      const name = req.query.name as string;
      const code = req.query.code as string;
      const isActive = req.query.isActive ?? true;
      const isDefault = req.query.isDefault ?? false;

      // Build query with search conditions and response count
      const query = this.surveyRepo
        .createQueryBuilder("survey")
        .select([
          "survey.id",
          "survey.name",
          "survey.code",
          "survey.description",
          "survey.isActive",
          "survey.createdAt",
          "survey.updatedAt",
          "survey.defaultIdentifier",
        ])
        .leftJoin("survey.responses", "responses")
        .addSelect("COUNT(DISTINCT responses.id)", "responseCount")
        .where("1 = 1") // Always true to start with, will dynamically add conditions
        .groupBy("survey.id"); // Group by survey to get correct counts

      // Filter by name
      if (name) {
        query.andWhere("survey.name ILIKE :name", { name: `%${name}%` });
      }

      // Filter by code
      if (code) {
        query.andWhere("survey.code ILIKE :code", { code: `%${code}%` });
      }

      // Filter by isActive if provided
      if (isActive) {
        query.andWhere("survey.isActive = :isActive", { isActive });
      }
      if (isDefault) {
        query.andWhere("survey.isDefault = :isDefault", { isDefault });
      }

      // Order by createdAt date, latest first
      query.orderBy("survey.createdAt", "DESC");

      // Get the paginated results
      const rawResults = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getRawAndEntities();

      // Get total count for pagination
      const totalItems = await query.getCount();

      // Transform the results to include the response count
      const surveys = rawResults.entities.map((survey, index) => ({
        ...survey,
        responseCount: parseInt(rawResults.raw[index].responseCount) || 0,
      }));

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Send paginated data in response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Surveys retrieved successfully.",
        data: surveys,
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

  async searchCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const name = req.query.name as string;

      // Build query to search for categories by name
      const query = this.categoryRepo
        .createQueryBuilder("category")
        .leftJoinAndSelect("category.surveys", "survey") // Join surveys related to the category
        .leftJoinAndSelect("category.questions", "question"); // Join questions related to the category

      // Apply a case-insensitive filter if a name is provided
      if (name) {
        query.where("LOWER(category.name) LIKE LOWER(:name)", {
          name: `%${name}%`, // Use wildcard for partial matching
        });
      }

      // Pagination logic
      const [categories, totalItems] = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Format each category's data to include surveys and questions
      const categoryData = categories.map((category) => ({
        id: category.id,
        name: category.name,
        allowMultipleResponse: category.allowMultipleResponse,
        surveys: category.surveys.map((survey) => ({
          name: survey.name,
        })),
        questions: category.questions.map((question) => ({
          description: question.description,
        })),
      }));

      // Send paginated data in response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Categories retrieved successfully.",
        data: categoryData,
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

  async searchQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const description = req.query.description as string; // The description to search for

      // Build query to search for questions by description
      const query = this.questionRepo.createQueryBuilder("question");

      // If a description is provided, apply a case-insensitive filter
      if (description) {
        query.where("LOWER(question.description) LIKE LOWER(:description)", {
          description: `%${description}%`, // Use wildcard for partial matching
        });
      }

      // Pagination logic
      const [questions, totalItems] = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      const formattedQuestions = questions.map(
        ({ createdAt, updatedAt, modifiedBy, ...rest }) => rest
      );
      // Send paginated data in response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Questions retrieved successfully.",
        data: formattedQuestions,
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

  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const id = Number(req.params.id);

      // Find the category with its associated questions and options
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ["questions", "questions.options"], // Include related questions and options
      });

      if (!category) {
        throw new HttpError(404, `Category with ID ${id} not found`);
      }

      // Remove the id field from category, questions, and options
      const categoryData = {
        name: category.name,
        allowMultipleResponse: category.allowMultipleResponse,
        questions: category.questions.map((question) => ({
          description: question.description,
          type: question.type,
          isRequired: question.isRequired,
          options: question.options.map((option) => ({ value: option.value })), // Include only the option values
        })),
      };

      return res.status(200).json({
        status: 200,
        success: true,
        message: `Category with ID: ${id} has been retrieved successfully.`,
        data: categoryData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuestionById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const id = Number(req.params.id);

      // Find the question with relations (options, etc.)
      const question = await this.questionRepo.findOne({
        where: { id },
        relations: {
          options: true, // Include related options
        },
      });

      if (!question) {
        throw new HttpError(404, `Question with ID ${id} not found`);
      }
      // Exclude unwanted fields from question and options
      const { createdAt, updatedAt, modifiedBy, options, ...questionData } =
        question;
      const formattedOptions = options.map(
        ({ createdAt, updatedAt, modifiedBy, ...optionData }) => optionData
      );
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Question with ID: ${id} has been retrieved successfully.`,
        data: {
          ...questionData,
          options: formattedOptions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllWithData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract query parameters for filtering
      const name = req.query.name as string;
      const code = req.query.code as string;
      const isActive = req.query.isActive ?? true;

      // Build query with search conditions
      const query = this.surveyRepo
        .createQueryBuilder("survey")
        .leftJoinAndSelect("survey.categories", "category")
        .leftJoinAndSelect("survey.responses", "response")
        .leftJoinAndSelect("category.questions", "question")
        .leftJoinAndSelect("question.options", "option")
        .select([
          "survey.id",
          "survey.name",
          "survey.code",
          "survey.description",
          "survey.isActive",
          "category.id",
          "category.name",
          "category.allowMultipleResponse",
          "category.orderNumber",
          "response.id",
          "question.id",
          "question.type",
          "question.isRequired",
          "question.description",
          "question.orderNumber",
          "option.id",
          "option.value",
          "option.orderNumber",
        ])
        .where("1 = 1"); // Always true to start with, will dynamically add conditions

      // Filter by name
      if (name) {
        query.andWhere("survey.name ILIKE :name", { name: `%${name}%` });
      }

      // Filter by code
      if (code) {
        query.andWhere("survey.code ILIKE :code", { code: `%${code}%` });
      }

      // Filter by isActive if provided
      if (isActive) {
        query.andWhere("survey.isActive = :isActive", { isActive });
      }

      // Order by createdAt date, latest first
      query
        .orderBy("survey.createdAt", "DESC")
        .addOrderBy("category.orderNumber", "ASC")
        .addOrderBy("question.orderNumber", "ASC")
        .addOrderBy("option.orderNumber", "ASC");

      // Fetch all surveys and relations
      const surveys = await query.getMany();

      // Remove createdAt and updatedAt from each relation in the final JSON response
      const formattedSurveys = surveys.map((survey) => {
        return {
          ...survey,
          categories: survey.categories
            .sort((a, b) => a.orderNumber - b.orderNumber)
            .map((category) => ({
              id: category.id,
              name: category.name,
              allowMultipleResponse: category.allowMultipleResponse,
              questions: category.questions
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map((question) => ({
                  id: question.id,
                  type: question.type,
                  isRequired: question.isRequired,
                  description: question.description,
                  options: question.options
                    .sort((a, b) => a.orderNumber - b.orderNumber)
                    .map((option) => ({
                      id: option.id,
                      value: option.value,
                    })),
                })),
            })),
          responses: survey.responses.map((response) => ({
            id: response.id,
          })),
        };
      });

      // Send the data in the response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Surveys retrieved successfully.",
        data: formattedSurveys,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSurveysForMapOptions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Fetch all surveys from the database
      const surveys = await this.surveyRepo.find();

      // Map the surveys to the required format
      const formattedSurveys = surveys.map((survey) => ({
        label: survey.name,
        value: survey.id.toString(), // Ensure the ID is a string
      }));

      // Return the formatted surveys as a response
      return res.json({
        status: 200,
        success: true,
        message: "Surveys retreived successfully.",
        data: formattedSurveys,
      });
    } catch (error) {
      console.log(error);
      // Pass any errors to the error-handling middleware
      next(error);
    }
  }

  // Add this method to your SurveyController class
  async downloadSurveyDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = req.params.surveyId;

      // Find the survey with its related entities
      const survey = await this.surveyRepo.findOne({
        where: { id: Number(surveyId) },
        relations: {
          categories: true,
          responses: false,
        },
        order: {
          categories: {
            orderNumber: "ASC",
          },
        },
      });

      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      // Find questions related to this survey's categories, ordered properly
      const questions = await this.questionRepo.find({
        where: {
          categories: survey.categories.map((category) => ({
            id: category.id,
          })),
        },
        relations: {
          options: true,
          categories: true,
        },
        order: {
          orderNumber: "ASC",
        },
      });

      // Create a new PDF document with enhanced layout
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });
      const fontPath = path.join(__dirname, "..", "media", "np.ttf");
      // Register custom font
      doc.registerFont("NepaliFont", fontPath);
      // Register custom font

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="survey_${survey.id}_details.pdf"`
      );

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Refined Color Palette
      const palette = {
        background: "#FFFFFF",
        primary: "#000000", // Pure black for primary text
        secondary: "#666666", // Soft gray for secondary information
        accent: "#1A73E8", // Google-like blue for headings
        highlight: "#34A853", // Green for required indicators
      };

      // Page Header
      doc
        .fillColor(palette.primary)
        .font("NepaliFont")
        .fontSize(24)
        .text("Survey Details", {
          align: "center",
        });

      doc.moveDown(1.5);

      // Survey Overview
      doc
        .fillColor(palette.primary)
        .font("NepaliFont")
        .fontSize(18)
        .text("Survey Overview", { underline: true });

      doc.fillColor(palette.primary).fontSize(12).moveDown(0.5);

      // Survey Details
      const surveyDetails = [
        { label: "Name", value: survey.name },
        { label: "Code", value: survey.code },
        { label: "Description", value: survey.description },
        { label: "Status", value: survey.isActive ? "Active" : "Inactive" },
      ];

      surveyDetails.forEach((detail) => {
        doc
          .fillColor(palette.secondary)
          .fontSize(12)
          .text(`${detail.label}: `, { continued: true })
          .fillColor(palette.primary)
          .text(detail.value);
      });

      doc.moveDown(1.5);

      // Process categories
      survey.categories.forEach((category, categoryIndex) => {
        const categoryQuestions = questions
          .filter((q) => q.categories.some((c) => c.id === category.id))
          .sort((a, b) => a.orderNumber - b.orderNumber);

        // Category Header
        // Category Header
        doc
          .fillColor("#2C3E50") // Dark blue/gray color
          .fontSize(18) // Slightly larger font size for emphasis
          .text(`Category ${categoryIndex + 1}: ${category.name}`, {
            underline: true, // Underline the category title
          });

        // Multiple responses info
        doc
          .fillColor(palette.secondary)
          .fontSize(10)
          .text(
            `Multiple Responses: ${
              category.allowMultipleResponse ? "Allowed" : "Not Allowed"
            }`,
            { align: "right" }
          )
          .moveDown(0.5);

        // Questions
        categoryQuestions.forEach((question, questionIndex) => {
          // Question Header

          doc
            .fillColor(palette.primary)
            .fontSize(14)
            .text(`${questionIndex + 1}: ${question.description}`, {
              continued: true, // Keep the text on the same line
            });

          if (question.isRequired) {
            doc.fillColor("red").text(" *", { continued: true }); // Add the asterisk in red
          }

          doc.fillColor(palette.primary).text(` (${question.type})`, {
            continued: false,
          });

          // Options for specific question types
          const optionTypes = [
            "dropdown",
            "multiple_choice_single_select",
            "multiple_choice_multiple_select",
          ];

          if (
            optionTypes.includes(question.type) &&
            question.options.length > 0
          ) {
            doc
              .fillColor(palette.secondary)
              .fontSize(12)
              .text("Options:", { continued: false });

            question.options
              .sort((a, b) => a.orderNumber - b.orderNumber)
              .forEach((option, optionIndex) => {
                doc
                  .fillColor(palette.primary)
                  .fontSize(10)
                  .text(`   • ${option.value}`);
              });
          }

          doc.moveDown(0.5);
        });

        doc.moveDown();
      });

      // Summary Calculation
      const totalCategories = survey.categories.length;
      const totalQuestions = questions.length;
      const estimatedTime = Math.ceil((totalQuestions * 10) / 60); // Convert seconds to minutes

      // Draw a line before summary
      doc
        .moveDown(1)
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);

      // Summary Header
      doc
        .fillColor(palette.primary)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Survey Summary", { underline: true });

      // Summary Details
      const summaryDetails = [
        { label: "Total Categories", value: totalCategories },
        { label: "Total Number of Questions", value: totalQuestions },
        {
          label: "Estimated survey time per response",
          value: `${estimatedTime} minutes`,
        },
      ];

      doc.moveDown(0.5);

      summaryDetails.forEach((detail: any) => {
        doc
          .fillColor(palette.secondary)
          .fontSize(12)
          .text(`${detail.label}: `, { continued: true })
          .fillColor(palette.primary)
          .text(detail.value);
      });

      doc.moveDown(1);
      // Footer
      doc
        .fontSize(10)
        .fillColor(palette.secondary)
        .text(
          `Generated through Palika GIS Portal on: ${new Date().toLocaleDateString()}`,
          50,
          doc.page.height - 30,
          { align: "center" }
        );

      // Finalize PDF
      doc.end();
    } catch (error) {
      if (res.headersSent) {
        console.error("Headers already sent", error);
        return;
      }

      console.error(error);

      if (!res.finished) {
        res.status(500).json({
          message: "An error occurred while generating the PDF",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }


  async getAllSurveyWhereAUserhasCollectedAResponse(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const userId = parseInt(req.user.id, 10);
  
      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new HttpError(400, "User doesn't exist.");
      }
  
      const name = req.query.name as string;
      const code = req.query.code as string;
      const isActive = req.query.isActive;
      const isDefault = req.query.isDefault;
  
      // Query to get surveys with their responses
      const query = this.surveyRepo
        .createQueryBuilder("survey")
        .innerJoinAndSelect("survey.responses", "response", "response.surveyTakenById = :userId", { userId })
        .leftJoinAndSelect("response.answers", "answer") // Optionally join answers if needed
        .select([
          "survey.id",
          "survey.name",
          "survey.code",
          "survey.description",
          "survey.isActive",
          "survey.createdAt",
          "survey.updatedAt",
          "survey.defaultIdentifier",
          "response.id", // Response ID
          "response.googlePlusCode",
          "response.houseLatitude",
          "response.houseLongitude",
          "response.surveyTakenPlaceLatitude AS surveyLatitude", // Survey Latitude
          "response.surveyTakenPlaceLongitude AS surveyLongitude", // Survey Longitude
          "response.createdAt", // Response created date
        ])
        .orderBy("survey.createdAt", "DESC");
  
      if (name) {
        query.andWhere("survey.name ILIKE :name", { name: `%${name}%` });
      }
  
      if (code) {
        query.andWhere("survey.code ILIKE :code", { code: `%${code}%` });
      }
  
      if (isActive !== undefined) {
        query.andWhere("survey.isActive = :isActive", { isActive });
      }
  
      if (isDefault !== undefined) {
        query.andWhere("survey.isDefault = :isDefault", { isDefault });
      }
  
      const rawResults = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getRawAndEntities();
  
      const totalItems = await query.getCount();
  
      const surveys = rawResults.entities.map((survey, index) => ({
        ...survey,
        responses: rawResults.entities[index].responses.map(response => ({
          responseId: response.id,
          googlePlusCode: response.googlePlusCode,
          houseLatitude: response.houseLatitude,
          houseLongitude: response.houseLongitude,
          surveyLatitude: response.surveyTakenPlaceLatitude,
          surveyLongitude: response.surveyTakenPlaceLongitude,
          createdAt: response.createdAt,
        })),
      }));
  
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;
  
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Surveys retrieved successfully.",
        data: surveys,
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
      console.log(error);
      next(error);
    }
  }
  
  
  
}

export default new SurveyController();
