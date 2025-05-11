import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Cadastral } from "../entities/cadastral/Cadastral";
import HttpError from "../util/httpError";
import { User } from "../entities/user/User";
import {
  GharBatoSifarish,
  PavementType,
} from "../entities/cadastral/gharBatoSifarish";

class GharBatoSifarishController {
  constructor(
    private gharBatoSifarishRepo = AppDataSource.getRepository(
      GharBatoSifarish
    ),
    private cadastralRepo = AppDataSource.getRepository(Cadastral),
    private userRepo = AppDataSource.getRepository(User)
  ) {}

  async createSifarish(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const {
      municipality,
      ownerEng,
      ownerNepali,
      cadastralId,
      tole,
      access_road_is_present,
      access_road_width,
      access_road_pavement_type,
      acess_road_name,
      secondary_road_is_present,
      secondary_road_width,
      secondary_road_pavement_type,
      secondary_road_name,
      main_road_is_present,
      main_road_width,
      main_road_pavement_type,
      main_road_name,
    } = req.body;

    const user = req.user;

    try {
      // Validate required fields
      if (
        !municipality ||
        !ownerEng ||
        !ownerNepali ||
        !cadastralId ||
        !tole ||
        access_road_is_present == null ||
        access_road_is_present == undefined
      ) {
        throw new HttpError(400, "Required fields are missing");
      }

      // Validate road information
      if (
        access_road_is_present &&
        (!access_road_width || !access_road_pavement_type)
      ) {
        throw new HttpError(400, "Access road details are incomplete");
      }

      if (
        secondary_road_is_present &&
        (!secondary_road_width || !secondary_road_pavement_type)
      ) {
        throw new HttpError(400, "Secondary road details are incomplete");
      }

      if (
        main_road_is_present &&
        (!main_road_width || !main_road_pavement_type)
      ) {
        throw new HttpError(400, "Main road details are incomplete");
      }

      // Validate pavement types
      const validatePavementType = (type: string): PavementType => {
        if (!Object.values(PavementType).includes(type as PavementType)) {
          throw new HttpError(400, `Invalid pavement type: ${type}`);
        }
        return type as PavementType;
      };

      const sifarish = new GharBatoSifarish();
      sifarish.municipality = municipality;
      sifarish.ownerEng = ownerEng;
      sifarish.ownerNepali = ownerNepali;
      sifarish.tole = String(tole);

      // Road information
      sifarish.access_road_is_present = access_road_is_present;
      if (access_road_is_present) {
        sifarish.access_road_width = access_road_width;
        sifarish.access_road_pavement_type = validatePavementType(
          access_road_pavement_type
        );
        sifarish.acess_road_name = acess_road_name;
      }

      sifarish.secondary_road_is_present = secondary_road_is_present;
      if (secondary_road_is_present) {
        sifarish.secondary_road_width = secondary_road_width;
        sifarish.secondary_road_pavement_type = validatePavementType(
          secondary_road_pavement_type
        );
        sifarish.secondary_road_name = secondary_road_name;
      }

      sifarish.main_road_is_present = main_road_is_present;
      if (main_road_is_present) {
        sifarish.main_road_width = main_road_width;
        sifarish.main_road_pavement_type = validatePavementType(
          main_road_pavement_type
        );
        sifarish.main_road_name = main_road_name;
      }

      const cadastral = await this.cadastralRepo.findOneBy({
        ogcFid: Number(cadastralId),
      });
      if (!cadastral) {
        throw new HttpError(404, "Cadastral couldn't be found.");
      }

      sifarish.cadastral = cadastral;
      sifarish.modifiedBy = Number(user.id);

      await this.gharBatoSifarishRepo.save(sifarish);

      return res.status(201).json({
        status: 201,
        message: "Sifarish generated successfully.",
        data: sifarish,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getSifarishByUuid(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { uuid } = req.params;
    const withDetails = String(req?.query?.withDetails ?? "true");

    try {
      const sifarish = await this.gharBatoSifarishRepo.findOne({
        where: { uuid },
        relations: ["cadastral"],
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
      const userName = `${createdBy?.firstName ?? "unknown"} ${
        createdBy?.lastName ?? "unknown"
      }`;

      return res.status(200).json({
        status: 200,
        message: "Sifarish retrieved successfully.",
        data:
          withDetails === "true"
            ? { ...sifarish, createdBy: userName }
            : { uuid },
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getSifarish(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const uuid = req.query.uuid as string;
      const owner = req.query.owner as string;
      const kitta = req.query.kitta;

      let queryBuilder = this.gharBatoSifarishRepo
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
        ]);

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

      const skip = (page - 1) * pageSize;
      queryBuilder.skip(skip).take(pageSize);

      const [sifarishRecords, totalItems] =
        await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(totalItems / pageSize);

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
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages,
        },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async toggleValidState(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sifarish = await this.gharBatoSifarishRepo.findOneBy({
        id: Number(id),
      });

      if (!sifarish) {
        throw new HttpError(400, "Sifarish not found");
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
      const sifarish = await this.gharBatoSifarishRepo.findOneBy({
        id: Number(id),
      });

      if (!sifarish) {
        throw new HttpError(400, "Sifarish not found");
      }

      await this.gharBatoSifarishRepo.remove(sifarish);

      return res.status(200).json({
        status: 200,
        message: `Sifarish with ID ${id} successfully deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GharBatoSifarishController();
