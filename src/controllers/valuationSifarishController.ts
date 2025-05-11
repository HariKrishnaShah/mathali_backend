import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Cadastral } from "../entities/cadastral/Cadastral";
import HttpError from "../util/httpError";
import { User } from "../entities/user/User";
import { Raw } from "typeorm";
import { ValuationSifarish } from "../entities/cadastral/ValuationSifarish";

class ValuationSifarishController {
  constructor(
    private valuationSifarishRepo = AppDataSource.getRepository(
      ValuationSifarish
    ),
    private cadastralRepo = AppDataSource.getRepository(Cadastral),
    private userRepo = AppDataSource.getRepository(User)
  ) {}

  // Method to create a new Sifarish
  async createSifarish(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { municipality, ownerEng, ownerNepali, cadastralId, tole } = req.body;

    const user = req.user;

    try {
      if (!municipality || !ownerEng || !ownerNepali || !cadastralId || !tole) {
        throw new HttpError(400, "Ensure all fields are present");
      }
      const sifarish = new ValuationSifarish();

      sifarish.municipality = municipality;
      sifarish.ownerEng = ownerEng;
      sifarish.ownerNepali = ownerNepali;
      sifarish.tole = String(tole);

      const cadastral = await this.cadastralRepo.findOneBy({
        ogcFid: Number(cadastralId),
      });
      if (!cadastral) {
        throw new HttpError(404, "Cadastral couldn't be found.");
      }

      sifarish.cadastral = cadastral;
      sifarish.modifiedBy = Number(user.id);

      // Save the Sifarish entity
      await this.valuationSifarishRepo.save(sifarish);

      return res.status(200).json({
        status: 201,
        message: "Valuation sifarish generated sucessfully.",
        data: sifarish,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  // Method to get Sifarish by UUID
  async getSifarishByUuid(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { uuid } = req.params;
    const withDetails = String(req?.query?.withDetails ?? "false");

    try {
      const sifarish = await this.valuationSifarishRepo.findOne({
        where: { uuid },
        relations: ["cadastral"], // Optionally, include related cadastral data
      });

      if (!sifarish) {
        return res.status(404).json({ message: "Sifarish not found" });
      }

      if (sifarish.isValid == false) {
        throw new HttpError(400, "The sifarish is invalid.");
      }
      const createdBy = await this.userRepo.findOneBy({
        id: Number(sifarish.modifiedBy),
      });
      const userName =
        createdBy?.firstName ?? "unknown" + createdBy?.lastName ?? "unknown";

      return res.status(200).json({
        status: 200,
        message: "Sifarish retreived successfully.",
        data:
          withDetails == "true"
            ? { ...sifarish, createdBy: userName }
            : { uuid },
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async toggleValidState(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sifarish = await this.valuationSifarishRepo.findOneBy({
        id: Number(id),
      });
      if (!sifarish) {
        throw new HttpError(400, "sifarish not found");
      }

      sifarish.isValid = !sifarish.isValid;

      const updatedSifarish = await sifarish.save();

      return res.status(200).json({
        status: 200,
        message: `Is valid status updated to ${updatedSifarish.isValid}`,
        data: updatedSifarish,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteSifarish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if the Sifarish exists
      const sifarish = await this.valuationSifarishRepo.findOneBy({
        id: Number(id),
      });
      if (!sifarish) {
        throw new HttpError(400, "Sifarish not found");
      }

      // Delete the Sifarish record
      await this.valuationSifarishRepo.remove(sifarish);

      return res.status(200).json({
        status: 200,
        message: `Sifarish with ID ${id} successfully deleted`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSifarish(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract pagination, uuid, kitta, and owner search parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const uuid = req.query.uuid as string;
      const owner = req.query.owner as string;
      const kitta = req.query.kitta;

      // Create query builder
      let queryBuilder = this.valuationSifarishRepo
        .createQueryBuilder("sifarish")
        .leftJoin("sifarish.cadastral", "cadastral")
        .addSelect([
          "cadastral.ogcFid",
          "cadastral.parcelNo",
          "cadastral.wardNo",
          "cadastral.shapeArea",
          "cadastral.sheetNo",
          "cadastral.zone",
          "cadastral.zoneNepali",
          "cadastral.formerVdc",
          "cadastral.remarks",
          "cadastral.valuation",
        ])
        .orderBy("sifarish.createdAt", "DESC");

      // Add conditions
      if (uuid) {
        queryBuilder.andWhere("sifarish.uuid = :uuid", { uuid });
      }

      if (kitta) {
        queryBuilder.andWhere("cadastral.parcelNo = :kitta", {
          kitta: Number(kitta),
        });
      }

      if (owner) {
        queryBuilder.andWhere(
          "(sifarish.ownerEng ILIKE :owner OR sifarish.ownerNepali ILIKE :owner)",
          { owner: `%${owner}%` }
        );
      }

      // Add pagination
      const skip = (page - 1) * pageSize;
      queryBuilder.skip(skip).take(pageSize);

      // Execute query
      const [sifarishRecords, totalItems] =
        await queryBuilder.getManyAndCount();

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Sifarish data retrieved successfully.",
        data: sifarishRecords,
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

export default new ValuationSifarishController();
