import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Cadastral } from "../entities/cadastral/Cadastral";
import { Ward } from "../entities/basic/Ward";
import { CadastralPoints } from "../entities/cadastral/CadastralPoints";
import { User } from "../entities/user/User";
import {
  CadastralUpdateRequest,
  statusEnum,
} from "../entities/cadastral/CadastralUpdateRequest";
import HttpError from "../util/httpError";
import { Raw } from "typeorm";

class CadastralUpdateRequestController {
  constructor(
    private userRepo = AppDataSource.getRepository(User),
    private cadastralUpdateRequestRepo = AppDataSource.getRepository(
      CadastralUpdateRequest
    ),
    private landCadastralRepo = AppDataSource.getRepository(Cadastral),
    private landCadastralPointRepo = AppDataSource.getRepository(
      CadastralPoints
    )
  ) {}

  async createRequest(req: any, res: Response, next: NextFunction) {
    try {
      const ogcFid = req.params.ogcFid;
      const {
        parcelNo,
        wardNo,
        sheetNo,
        zone,
        formerVdc,
        zoneNepali,
        remarks,
        valuation,
        userComment,
      } = req.body;
      const userId = req.user.id; // Assume req.user is populated via middleware

      if (!ogcFid) {
        throw new HttpError(403, "Cadastral's ogcFid is required,");
      }

      const cadastralToBeUpdated = await this.landCadastralRepo.findOneBy({
        ogcFid: Number(ogcFid),
      });
      if (!cadastralToBeUpdated) {
        throw new HttpError(403, "Cadastral's couldn't be found,");
      }

      // Validate input
      if (!parcelNo || !wardNo || !sheetNo || !zone || !valuation) {
        return res.status(400).json({
          message:
            "All fields (parcelNo, wardNo, sheetNo, zone, formerVdc, valuation) are required.",
        });
      }

      // Find the user making the request
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Create a new CadastralUpdateRequest entity
      const cadastralUpdateRequest = this.cadastralUpdateRequestRepo.create({
        parcelNo,
        wardNo,
        sheetNo,
        zone,
        formerVdc,
        remarks,
        user, // Set the user relation
        cadastral: cadastralToBeUpdated,
        userComment,
        zoneNepali,
        valuation,
      });

      // Save the entity
      const savedRequest = await this.cadastralUpdateRequestRepo.save(
        cadastralUpdateRequest
      );

      return res.status(201).json({
        message: "Cadastral update request created successfully.",
        data: savedRequest,
      });
    } catch (error) {
      console.log(error);
      console.error("Error creating cadastral update request:", error);
      next(error);
    }
  }

  async getCadastralUpdateRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const parcelNo = Number(req.query.parcelNo as string);
      const sheetNo = req.query.sheetNo as string;
      const wardNo = req.query.wardNo as string;
      const cadastralId = parseInt(req.query.cadastralId as string);
      const requestStatus = req.query.status;
      // Build filter conditions
      const conditions: any = {};
      if (requestStatus) {
        conditions.status = requestStatus;
      }
      if (parcelNo) {
        conditions.parcelNo = parcelNo;
      }
      if (sheetNo)
        conditions.sheetNo = Raw((alias) => `${alias} ILIKE :value`, {
          value: `%${sheetNo}%`,
        });
      if (wardNo)
        conditions.wardNo = Raw((alias) => `${alias} ILIKE :value`, {
          value: `%${wardNo}%`,
        });
      if (cadastralId) conditions.cadastral = { ogcFid: cadastralId };

      // Fetch paginated data
      const [requests, totalItems] =
        await this.cadastralUpdateRequestRepo.findAndCount({
          where: conditions,
          relations: ["cadastral"],
          order: { id: "DESC" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

      // Map data to include old and new values
      const formattedData = requests.map((request) => {
        const cadastral = request.cadastral;
        return {
          id: request.id,
          user: request.user,
          parcelNo: { old: cadastral?.parcelNo, new: request.parcelNo },
          wardNo: { old: cadastral?.wardNo, new: request.wardNo },
          sheetNo: { old: cadastral?.sheetNo, new: request.sheetNo },
          zone: { old: cadastral?.zone, new: request.zone },
          formerVdc: { old: cadastral?.formerVdc, new: request.formerVdc },
          zoneNepali: { old: cadastral?.zoneNepali, new: request.zoneNepali },
          remarks: request.remarks,
          userComment: request.userComment,
          status: request.status,
          ogcFid: request.cadastral.ogcFid,
          valuation: { old: cadastral?.valuation, new: request?.valuation },
        };
      });

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Cadastral update requests retrieved successfully.",
        data: formattedData,
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

  async approveCadastralUpdateRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;

      // Find the CadastralUpdateRequest by ID
      const updateRequest = await this.cadastralUpdateRequestRepo.findOne({
        where: { id: parseInt(id, 10) },
        relations: ["cadastral"],
      });

      if (!updateRequest) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Cadastral update request not found.",
        });
      }

      if (updateRequest.status == statusEnum.APPROVED) {
        throw new HttpError(
          403,
          "The cadastral update request was already approved."
        );
      }
      if (updateRequest.status == statusEnum.REJECTED) {
        throw new HttpError(
          403,
          "The cadastral update request was already rejected."
        );
      }

      // Find the associated cadastral
      const cadastral = updateRequest.cadastral;
      if (!cadastral) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Associated cadastral not found.",
        });
      }

      const cadastralPoint = await AppDataSource.getRepository(
        CadastralPoints
      ).findOneBy({ ogcFid: Number(cadastral.ogcFid) });
      if (!cadastralPoint) {
        throw new HttpError(
          403,
          "The cadastral update request was already rejected."
        );
      }

      // Update cadastral with new values from the update request
      cadastral.parcelNo = updateRequest.parcelNo;
      cadastral.wardNo = updateRequest.wardNo;
      cadastral.sheetNo = updateRequest.sheetNo;
      cadastral.zone = updateRequest.zone;
      cadastral.formerVdc = updateRequest.formerVdc;
      cadastral.remarks = updateRequest.remarks;
      cadastral.zoneNepali = updateRequest.zoneNepali;
      cadastral.valuation = updateRequest.valuation;

      cadastralPoint.parcelNo = updateRequest.parcelNo;
      cadastralPoint.wardNo = updateRequest.wardNo;
      cadastralPoint.sheetNo = updateRequest.sheetNo;
      cadastralPoint.zone = updateRequest.zone;
      cadastralPoint.formerVdc = updateRequest.formerVdc;
      cadastralPoint.remarks = updateRequest.remarks;
      cadastralPoint.zoneNepali = updateRequest.zoneNepali;
      cadastralPoint.valuation = updateRequest.valuation;

      await AppDataSource.getRepository(CadastralPoints).save(cadastralPoint);

      // Save the updated cadastral
      await this.landCadastralRepo.save(cadastral);

      // Optionally delete the update request or mark it as approved
      updateRequest.status = statusEnum.APPROVED;
      this.cadastralUpdateRequestRepo.save(updateRequest);
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Cadastral updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectCadastralUpdateRequest(req: any, res: any, next: NextFunction) {
    try {
      const { id } = req.params;

      // Find the CadastralUpdateRequest by ID
      const updateRequest = await this.cadastralUpdateRequestRepo.findOne({
        where: { id: parseInt(id, 10) },
        relations: ["cadastral"],
      });

      if (!updateRequest) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Cadastral update request not found.",
        });
      }

      if (updateRequest.status == statusEnum.APPROVED) {
        throw new HttpError(
          403,
          "The cadastral update request was already approved."
        );
      }
      if (updateRequest.status == statusEnum.REJECTED) {
        throw new HttpError(
          403,
          "The cadastral update request was already rejected."
        );
      }

      updateRequest.status = statusEnum.REJECTED;
      await this.cadastralUpdateRequestRepo.save(updateRequest);
      return res.status(200).json({
        status: 200,
        sucess: true,
        message: "Cadastral update request was rejected.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserCadastralUpdateRequests(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const userId = req.user.id;
      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const parcelNo = Number(req.query.parcelNo as string);
      const sheetNo = req.query.sheetNo as string;
      const wardNo = req.query.wardNo as string;
      const cadastralId = parseInt(req.query.cadastralId as string);
      const requestStatus = req.query.status;

      // Build filter conditions
      const conditions: any = {
        user: { id: parseInt(userId, 10) }, // Base condition for user's requests
      };

      // Add additional filter conditions
      if (requestStatus) {
        conditions.status = requestStatus;
      }
      if (parcelNo) {
        conditions.parcelNo = parcelNo;
      }
      if (sheetNo) {
        conditions.sheetNo = Raw((alias) => `${alias} ILIKE :value`, {
          value: `%${sheetNo}%`,
        });
      }
      if (wardNo) {
        conditions.wardNo = Raw((alias) => `${alias} ILIKE :value`, {
          value: `%${wardNo}%`,
        });
      }
      if (cadastralId) {
        conditions.cadastral = { ogcFid: cadastralId };
      }

      // Fetch paginated update requests with filters
      const [requests, totalItems] =
        await this.cadastralUpdateRequestRepo.findAndCount({
          where: conditions,
          relations: ["cadastral"],
          order: { id: "DESC" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

      // Map data to include old and new values
      const formattedData = requests.map((request) => {
        const cadastral = request.cadastral;
        return {
          id: request.id,
          parcelNo: { old: cadastral?.parcelNo, new: request.parcelNo },
          wardNo: { old: cadastral?.wardNo, new: request.wardNo },
          sheetNo: { old: cadastral?.sheetNo, new: request.sheetNo },
          zone: { old: cadastral?.zone, new: request.zone },
          formerVdc: { old: cadastral?.formerVdc, new: request.formerVdc },
          zoneNepali: { old: cadastral?.zoneNepali, new: request.zoneNepali },
          valuation: { old: cadastral?.valuation, new: request.valuation },
          remarks: request.remarks,
          userComment: request.userComment,
          status: request.status,
          ogcFid: request.cadastral?.ogcFid,
        };
      });

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Cadastral update requests retrieved successfully.",
        data: formattedData,
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

export default new CadastralUpdateRequestController();
