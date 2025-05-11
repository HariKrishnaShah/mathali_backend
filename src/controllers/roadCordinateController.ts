import { AppDataSource } from "../config/database";
import { RoadCordinate } from "../entities/road/RoadCordinate";
import { Ward } from "../entities/basic/Ward";
import { Brackets, In } from "typeorm";
import { NextFunction, Request, Response } from "express";
import HttpError from "../util/httpError";
class RoadCordinateController {
  constructor(
    private wardRepo = AppDataSource.getRepository(Ward),
    private roadCordinateRepo = AppDataSource.getRepository(RoadCordinate)
  ) {}

  // API to fetch road coordinates as GeoJSON
  async getRoadCoordinates(req: Request, res: Response, next: NextFunction) {
    try {
      const { showBlackTop, showConcrete, showGravel, showEarthen, ward } =
        req.query;

      const emptyGeojson = { type: "FeatureCollection", features: [] };
      // Convert boolean string parameters to actual booleans
      const filter = [];
      if (showBlackTop === "true") filter.push("BLACK TOP");
      if (showConcrete === "true") filter.push("CONCRETE");
      if (showGravel === "true") filter.push("GRAVEL");
      if (showEarthen === "true") filter.push("EARTHEN");

      // If no filters are applied, return an empty GeoJSON
      if (filter.length === 0) {
        return res.status(200).json({
          status: 200,
          success: true,
          message: "No pavement type selected so received empty geojson.",
          data: emptyGeojson,
        });
      }

      // Check if the ward filter is applied
      let wardBoundary: Ward | null = null;
      if (ward) {
        wardBoundary = await this.wardRepo.findOne({
          where: { ward: Number(ward) },
        });

        if (!wardBoundary) {
          throw new HttpError(404, "Ward not found");
        }
      }

      // Fetch road coordinates based on the filters and ward boundary
      let roadCordinates = await this.roadCordinateRepo.find({
        where: { pavementType: In(filter) },
      });

      // Filter road coordinates based on ward boundary (if provided)
      if (wardBoundary) {
        roadCordinates = await this.roadCordinateRepo
          .createQueryBuilder("road")
          .where("road.pavementType IN (:...pavementTypes)", {
            pavementTypes: filter,
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                "ST_Intersects(ST_SetSRID(ST_MakePoint(road.start_longitude, road.start_latitude), 4326), ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))"
              ).orWhere(
                "ST_Intersects(ST_SetSRID(ST_MakePoint(road.end_longitude, road.end_latitude), 4326), ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))"
              );
            })
          )
          .setParameter("wardGeometry", wardBoundary.geometry)
          .getMany();
      } else {
        // No ward boundary provided, apply only pavement type filter
        roadCordinates = await this.roadCordinateRepo.find({
          where: { pavementType: In(filter) },
        });
      }

      // Convert the road coordinates into GeoJSON format
      const formattedResponse = roadCordinates.map((road) => ({
        id: road.ogcFid,
        start: {
          lon: road.startLongitude,
          lat: road.startLatitude,
        },
        end: {
          lon: road.endLongitude,
          lat: road.endLatitude,
        },
      }));

      // Respond with GeoJSON
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Road Cordinates Retreived Successfully",
        data: formattedResponse,
      });
    } catch (error) {
      next(error);
      console.error("Error fetching road coordinates:", error);
    }
  }

  //API to update road coridnates
  async updateCoordinates(req: Request, res: Response, next: NextFunction) {
    try {
      const { position, longitude, latitude } = req.body;
      const ogcFid = Number(req.params.ogcFid);

      // Validate required fields
      if (
        !ogcFid ||
        !position ||
        longitude === undefined ||
        latitude === undefined
      ) {
        throw new HttpError(
          400,
          "Missing required fields: ogcFid, position, longitude, latitude"
        );
      }

      // Validate position
      const validPositions = ["start", "end"];
      if (!validPositions.includes(position)) {
        throw new HttpError(
          400,
          "Invalid position. Allowed values: 'start', 'end'"
        );
      }

      // Fetch the RoadCordinate entity by ID
      const roadCordinate = await this.roadCordinateRepo.findOne({
        where: { ogcFid },
      });
      if (!roadCordinate) {
        throw new HttpError(404, "RoadCordinate not found");
      }

      // Update coordinates based on position
      if (position === "start") {
        roadCordinate.startLongitude = longitude;
        roadCordinate.startLatitude = latitude;
      } else if (position === "end") {
        roadCordinate.endLongitude = longitude;
        roadCordinate.endLatitude = latitude;
      }

      // Save the updated entity
      await this.roadCordinateRepo.save(roadCordinate);

      // Respond with the updated entity
      res.status(200).json({
        message: "Coordinates updated successfully",
        data: roadCordinate,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoadCordinateController();
