import { AppDataSource } from "../config/database";
import { Road } from "../entities/road/Road";
import { Ward } from "../entities/basic/Ward";
import { NextFunction, Request, Response } from "express";
import HttpError from "../util/httpError";
import { ParsedQs } from "qs"; // Import ParsedQs
import { Pole } from "../entities/road/Pole";
import { Brackets } from "typeorm";

const parseCommaSeparatedValues = (
  value: string | ParsedQs | string[] | ParsedQs[] | undefined
): string[] | undefined => {
  if (typeof value === "string") {
    return value.split(",");
  }
  return undefined;
};
function parseRangeValues(
  rangeString: string | undefined
): { min: number; max: number }[] | null {
  if (!rangeString) return null;
  return rangeString.split(",").map((range) => {
    const [min, max] = range.split("-").map(Number);
    return { min, max };
  });
}
class RoadController {
  constructor(
    private roadRepo = AppDataSource.getRepository(Road),
    private wardRepo = AppDataSource.getRepository(Ward)
  ) {}

  // Helper function to parse comma-separated values into an array

  async getFilteredRoads(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        roadClass,
        pavementType,
        drainType,
        class: roadClassQuery,
        ward,
        lengthRange,
        widthRange,
        priorityI,
      } = req.query;

      // Start building query with optional filtering conditions
      let roadQuery = this.roadRepo.createQueryBuilder("road").where("1 = 1");

      // Filter by roadClass if provided and not empty
      if (roadClass && roadClass !== "") {
        const roadClassArray = parseCommaSeparatedValues(roadClass);
        if (roadClassArray && roadClassArray.length > 0) {
          roadQuery = roadQuery.andWhere(
            "road.roadClass IN (:...roadClassArray)",
            {
              roadClassArray,
            }
          );
        }
      }

      // Filter by multiple length ranges if provided
      if (lengthRange && lengthRange !== "") {
        const lengthRanges = parseRangeValues(lengthRange as string);
        if (lengthRanges) {
          const lengthConditions = lengthRanges
            .map(
              (range, index) =>
                `road.length BETWEEN :minL${index} AND :maxL${index}`
            )
            .join(" OR ");
          const lengthParams = lengthRanges.reduce(
            (params, range, index) => ({
              ...params,
              [`minL${index}`]: range.min,
              [`maxL${index}`]: range.max,
            }),
            {}
          );
          roadQuery = roadQuery.andWhere(`(${lengthConditions})`, lengthParams);
        }
      }

      // Filter by multiple width ranges if provided
      if (widthRange && widthRange !== "") {
        const widthRanges = parseRangeValues(widthRange as string);
        if (widthRanges) {
          const widthConditions = widthRanges
            .map(
              (range, index) =>
                `road.widthFeet BETWEEN :minW${index} AND :maxW${index}`
            )
            .join(" OR ");
          const widthParams = widthRanges.reduce(
            (params, range, index) => ({
              ...params,
              [`minW${index}`]: range.min,
              [`maxW${index}`]: range.max,
            }),
            {}
          );
          roadQuery = roadQuery.andWhere(`(${widthConditions})`, widthParams);
        }
      }

      // Filter by pavementType if provided and not empty
      if (pavementType && pavementType !== "") {
        const pavementTypeArray = parseCommaSeparatedValues(pavementType);
        if (pavementTypeArray && pavementTypeArray.length > 0) {
          roadQuery = roadQuery.andWhere(
            "road.pavementType IN (:...pavementTypeArray)",
            { pavementTypeArray }
          );
        }
      }

      // Filter by drainType if provided and not empty
      if (drainType && drainType !== "") {
        const drainTypeArray = parseCommaSeparatedValues(drainType);
        if (drainTypeArray && drainTypeArray.length > 0) {
          roadQuery = roadQuery.andWhere(
            "road.drainType IN (:...drainTypeArray)",
            {
              drainTypeArray,
            }
          );
        }
      }

      // Filter by road class (general class field) if provided and not empty
      if (roadClassQuery && roadClassQuery !== "") {
        const roadClassQueryArray = parseCommaSeparatedValues(roadClassQuery);
        if (roadClassQueryArray && roadClassQueryArray.length > 0) {
          roadQuery = roadQuery.andWhere(
            "road.class IN (:...roadClassQueryArray)",
            {
              roadClassQueryArray,
            }
          );
        }
      }

      // If ward is provided, add ward filtering based on ST_Within
      if (ward && ward !== "") {
        const wardEntity = await this.wardRepo.findOne({
          where: { ward: Number(ward) },
        });

        if (!wardEntity) {
          throw new HttpError(404, `Ward Number ${ward} not found.`);
        }

        roadQuery = roadQuery.andWhere(
          "ST_Within(road.wkbGeometry, ST_GeomFromGeoJSON(:wardGeometry))",
          { wardGeometry: wardEntity.geometry }
        );
      }
      if (priorityI && priorityI !== "") {
        const priorityIArray = parseCommaSeparatedValues(priorityI);
        if (priorityIArray && priorityIArray.length > 0) {
          roadQuery = roadQuery.andWhere(
            "road.priorityI IN (:...priorityIArray)",
            { priorityIArray }
          );
        }
      }

      // Get all roads that match the filtering criteria
      const roads = await roadQuery.getMany();

      // Convert filtered roads to GeoJSON format
      const geoJsonData = roads.map((road) => ({
        type: "Feature",
        geometry: road.wkbGeometry, // Assuming wkbGeometry is stored in GeoJSON format
        properties: {
          ogcFid: road.ogcFid,
          roadClass: road.roadClass,
          widthFeet: road.widthFeet,
          pavementType: road.pavementType,
          drainType: road.drainType,
          length: road.length,
          nameEnglish: road.nameEnglish,
          nameNepali: road.nameNepali,
          class: road.class,
          housesTouched: road.housesTouched,
          priorityIndex: road.priorityI,
        },
      }));

      return res.json({
        status: 200,
        success: true,
        message: "Road Geojson Data Retrieved Successfully.",
        data: {
          type: "FeatureCollection",
          features: geoJsonData,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoadByOgcFid(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract ogcFid from the request parameters
      const { ogcFid } = req.params;

      // Find the road by ogcFid
      const road = await this.roadRepo.findOne({
        where: { ogcFid: Number(ogcFid) },
      });

      // If road not found, return an error
      if (!road) {
        throw new HttpError(404, `Road with ogcFid ${ogcFid} not found.`);
      }

      // Convert the road data to GeoJSON format
      const geoJsonData = {
        type: "Feature",
        geometry: road.wkbGeometry, // Assuming wkbGeometry is stored in GeoJSON format
        properties: {
          ogcFid: road.ogcFid,
          roadClass: road.roadClass,
          widthFeet: road.widthFeet,
          pavementType: road.pavementType,
          drainType: road.drainType,
          length: road.length,
          nameEnglish: road.nameEnglish,
          nameNepali: road.nameNepali,
          // Add any other relevant properties here
        },
      };

      // Return the road data in GeoJSON format
      return res.json({
        status: 200,
        success: true,
        message: `Road Data found for ogcFid ${ogcFid}.`,
        data: geoJsonData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;

      // Extract query parameters
      const roadClass = req.query.roadClass as string;
      const roadClassType = req.query.class as string;
      const pavementType = req.query.pavementType as string;
      const drainType = req.query.drainType as string;
      const minLength = parseFloat(req.query.minLength as string) || 0; // Default to 0 if not provided
      const maxLength = parseFloat(req.query.maxLength as string) || 99999; // Default to unlimited
      const minWidth = parseFloat(req.query.minWidth as string) || 0; // Default to 0 if not provided
      const maxWidth = parseFloat(req.query.maxWidth as string) || 99999; // Default to unlimited

      // Extract sort order parameter
      const sortOrderAsc = req.query.sortOrderAsc === "true"; // If 'true', sort ascending

      // Sort parameters
      const sortBy = (req.query.sortBy as string) || "ogcFid"; // Default to sorting by 'ogcFid'
      const sortOrder = sortOrderAsc ? "ASC" : "DESC"; // Determine sort order based on sortOrderAsc

      // Validate sortBy
      const validSortBy = ["ogcFid", "length", "widthFeet"];

      if (!validSortBy.includes(sortBy)) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: `Invalid sortBy value. Valid values are ${validSortBy.join(
            ", "
          )}`,
        });
      }

      // Build query with search conditions
      const query = this.roadRepo
        .createQueryBuilder("road")
        .select([
          "road.ogcFid",
          "road.roadClass",
          "road.widthFeet",
          "road.pavementType",
          "road.drainType",
          "road.length",
          "road.nameEnglish",
          "road.nameNepali",
          "road.class",
          "road.housesTouched",
        ])
        .where("1 = 1"); // Always true to start with, will dynamically add conditions

      // Length range filter
      query.andWhere(
        "road.length >= :minLength AND road.length <= :maxLength",
        {
          minLength,
          maxLength,
        }
      );

      // Width range filter
      query.andWhere(
        "road.widthFeet >= :minWidth AND road.widthFeet <= :maxWidth",
        {
          minWidth,
          maxWidth,
        }
      );

      // Filter by roadClass
      if (roadClass) {
        query.andWhere("road.roadClass = :roadClass", { roadClass });
      }

      // Filter by Class
      if (roadClassType) {
        query.andWhere("road.class = :roadClassType", { roadClassType });
      }

      // Filter by pavementType
      if (pavementType) {
        query.andWhere("road.pavementType = :pavementType", { pavementType });
      }

      // Filter by drainType
      if (drainType) {
        query.andWhere("road.drainType = :drainType", { drainType });
      }

      // Sorting logic based on sortBy and sortOrder
      query.orderBy(`road.${sortBy}`, sortOrder);

      // Pagination logic
      const [roads, totalItems] = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Send paginated data in response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Road data retrieved successfully.",
        data: roads,
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

  async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { ogcFid } = req.params; // Get ogcFid from request params
      const {
        nameEnglish,
        width,
        nameNepali,
        pavementType,
        drainType,
        wardsTouched,
        length,
        class: roadClass, // 'class' is a reserved keyword, so use 'roadClass' for the body
        widthFeet,
        housesTouched,
        class: roadClassAlt, // 'class' is used here to capture both
      } = req.body; // Extract editable fields from the request body

      // Find the road by ogcFid
      const road = await this.roadRepo.findOne({
        where: { ogcFid: parseInt(ogcFid) },
      });

      // If the road is not found, return a 404 error
      if (!road) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: `Road with ogcFid ${ogcFid} not found.`,
        });
      }

      // Update the fields only if they are provided
      if (nameEnglish) road.nameEnglish = nameEnglish;
      if (width) road.width = width;
      if (nameNepali) road.nameNepali = nameNepali;
      if (pavementType) road.pavementType = pavementType;
      if (drainType) road.drainType = drainType;
      if (wardsTouched) road.wardsTouched = wardsTouched;
      if (length) road.length = length;
      if (roadClass) road.roadClass = roadClass; // Update roadClass field
      if (roadClassAlt) road.class = roadClassAlt; // Update class field
      if (widthFeet) road.widthFeet = widthFeet;
      if (housesTouched) road.housesTouched = housesTouched;

      // Save the updated road entity
      await this.roadRepo.save(road);

      // Return a success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: `Road with ogcFid ${ogcFid} updated successfully.`,
        data: road,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const roadRepository = this.roadRepo;
      const wardRepository = this.wardRepo;
      const ward = Number(req.query.ward);

      let wardGeometry: string | null = null;
      if (ward) {
        const wardRecord = await wardRepository.findOne({
          where: { ward },
        });
        if (wardRecord) {
          // Get the ward geometry and set SRID to 4326
          wardGeometry = wardRecord.geometry; // Assuming geometry is a string, check if geometry needs transformation
        }
      }

      // Helper function to handle null or empty string values
      const handleNullOrEmpty = (value: string | null, defaultValue: string) =>
        value && value.trim() !== "" ? value : defaultValue;

      // 1) Distinct Road Classes
      const distinctRoadClassesQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.roadClass")
        .where("road.roadClass IS NOT NULL AND road.roadClass != ''")
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .distinct(true);

      // 2) Total Number of Roads by each Road Class
      const totalRoadsByClassQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.roadClass, COUNT(*) AS totalRoads")
        .where("road.roadClass IS NOT NULL AND road.roadClass != ''")
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("road.roadClass");

      // 3) Total Road Length by Road Class
      const totalRoadLengthByClassQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.roadClass, SUM(road.length) AS totalLength")
        .where(
          "road.roadClass IS NOT NULL AND road.roadClass != '' AND road.length IS NOT NULL"
        )
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("road.roadClass");

      // 4) Average Road Width by Road Class
      const averageRoadWidthByClassQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.roadClass, AVG(road.width) AS averageWidth")
        .where(
          "road.roadClass IS NOT NULL AND road.roadClass != '' AND road.width IS NOT NULL"
        )
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("road.roadClass");

      // 5) Distinct Pavement Types
      const distinctPavementTypesQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.pavementType")
        .where("road.pavementType IS NOT NULL AND road.pavementType != ''")
        .distinct(true);

      // 6) Total Number of Roads by each Pavement Type
      const totalRoadsByPavementTypeQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.pavementType, COUNT(*) AS totalRoads")
        .where("road.pavementType IS NOT NULL AND road.pavementType != ''")
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("road.pavementType");

      // 7) Road Length Distribution
      const roadLengthDistributionQuery = roadRepository
        .createQueryBuilder("road")
        .select(
          `CASE 
            WHEN road.length <= 5 THEN '0-5 km' 
            WHEN road.length <= 10 THEN '5-10 km' 
            WHEN road.length <= 15 THEN '10-15 km' 
            WHEN road.length <= 20 THEN '15-20 km' 
            WHEN road.length <= 25 THEN '20-25 km' 
            WHEN road.length <= 30 THEN '25-30 km' 
            ELSE '30+ km' 
          END AS lengthRange, COUNT(*) AS totalRoads`
        )
        .where("road.length IS NOT NULL")
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("lengthRange");

      // 8) Road Width Distribution
      const roadWidthDistributionQuery = roadRepository
        .createQueryBuilder("road")
        .select(
          `CASE 
            WHEN road.width <= 5 THEN '0-5 meters' 
            WHEN road.width <= 10 THEN '5-10 meters' 
            WHEN road.width <= 15 THEN '10-15 meters' 
            WHEN road.width <= 20 THEN '15-20 meters' 
            ELSE '20+ meters' 
          END AS widthRange, COUNT(*) AS totalRoads`
        )
        .where("road.width IS NOT NULL")
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("widthRange");

      // 9) Total Road Length by Pavement Type
      const totalRoadLengthByPavementTypeQuery = roadRepository
        .createQueryBuilder("road")
        .select("road.pavementType, SUM(road.length) AS totalLength")
        .where(
          "road.pavementType IS NOT NULL AND road.pavementType != '' AND road.length IS NOT NULL"
        )
        .andWhere(
          new Brackets((qb) => {
            if (wardGeometry) {
              const geoJsonString = JSON.stringify(wardGeometry);
              qb.where(
                "ST_Within(road.wkbGeometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))",
                { wardGeometry: geoJsonString }
              );
            } else {
              qb.orWhere("1=1"); // Skip the ward check if no ward is provided
            }
          })
        )
        .groupBy("road.pavementType");
      // ========================
      // Execute all queries in parallel
      // ========================
      const [
        distinctRoadClasses,
        totalRoadsByClass,
        totalRoadLengthByClass,
        averageRoadWidthByClass,
        distinctPavementTypes,
        totalRoadsByPavementType,
        roadLengthDistribution,
        roadWidthDistribution,
        totalRoadLengthByPavementType,
      ] = await Promise.all([
        distinctRoadClassesQuery.getRawMany(),
        totalRoadsByClassQuery.getRawMany(),
        totalRoadLengthByClassQuery.getRawMany(),
        averageRoadWidthByClassQuery.getRawMany(),
        distinctPavementTypesQuery.getRawMany(),
        totalRoadsByPavementTypeQuery.getRawMany(),
        roadLengthDistributionQuery.getRawMany(),
        roadWidthDistributionQuery.getRawMany(),
        totalRoadLengthByPavementTypeQuery.getRawMany(),
      ]);

      // Convert distinct road/pavement arrays to minimal arrays of strings
      const roadClasses = distinctRoadClasses.map((r: any) => r.roadClass);
      const pavementTypes = distinctPavementTypes.map(
        (p: any) => p.pavementType
      );

      // ==============
      // Format Results
      // ==============

      // A) Total Roads by Class
      const formattedTotalRoadsByClass = totalRoadsByClass.map((r: any) => ({
        roadClass: handleNullOrEmpty(r.road_class, "Unclassified"),
        totalRoads: parseInt(r.totalroads, 10) || 0,
      }));

      // B) Total Road Length by Class
      const formattedTotalRoadLengthByClass = totalRoadLengthByClass.map(
        (r: any) => ({
          roadClass: handleNullOrEmpty(r.road_class, "Unclassified"),
          totalLength: parseFloat(r.totallength.toFixed(0)) || 0,
        })
      );

      // C) Average Road Width by Class
      const formattedAverageRoadWidthByClass = averageRoadWidthByClass.map(
        (r: any) => ({
          roadClass: handleNullOrEmpty(r.road_class, "Unclassified"),
          averageWidth: parseFloat(r.averagewidth.toFixed(0)) || 0,
        })
      );

      // D) Total Roads by Pavement Type
      const formattedTotalRoadsByPavementType = totalRoadsByPavementType.map(
        (r: any) => ({
          pavementType: handleNullOrEmpty(r.pavement_type, "Unknown"),
          totalRoads: parseInt(r.totalroads, 10) || 0,
        })
      );

      // E) Road Length Distribution
      const formattedRoadLengthDistribution = roadLengthDistribution.map(
        (r: any) => ({
          lengthRange: r.lengthrange,
          totalRoads: parseInt(r.totalroads, 10) || 0,
        })
      );

      // F) Road Width Distribution
      const formattedRoadWidthDistribution = roadWidthDistribution.map(
        (r: any) => ({
          widthRange: r.widthrange,
          totalRoads: parseInt(r.totalroads, 10) || 0,
        })
      );

      // G) Total Road Length by Pavement Type
      const formattedTotalRoadLengthByPavementType =
        totalRoadLengthByPavementType.map((r: any) => ({
          pavementType: handleNullOrEmpty(r.pavement_type, "Unknown"),
          totalLength: parseFloat(r.totallength.toFixed(0)) || 0,
        }));

      // ===============================
      //  Build Final Response Structure
      // ===============================
      const responseData = [
        {
          data: formattedTotalRoadsByClass,
          xAxisTitle: "Road Class",
          yAxisTitle: "Total Roads",
          chartName: "Total Number of Roads by Road Class",
          chartTitle: "Total Roads by Road Class",
        },
        {
          data: formattedTotalRoadLengthByPavementType,
          xAxisTitle: "Pavement Type",
          yAxisTitle: "Total Length (km)",
          chartName: "Road Length by Pavement Type(Km)",
          chartTitle: "Road Length by Pavement Type(Km)",
        },
        {
          data: formattedTotalRoadLengthByClass,
          xAxisTitle: "Road Class",
          yAxisTitle: "Total Length (km)",
          chartName: "Road Length by Road Class(Km)",
          chartTitle: "Road Length by Road Class(Km)",
        },
        {
          data: formattedAverageRoadWidthByClass,
          xAxisTitle: "Road Class",
          yAxisTitle: "Average Width (meters)",
          chartName: "Avg Road Width by Road Class(meter)",
          chartTitle: "Avg Road Width by Road Class(meter)",
        },
        {
          data: formattedTotalRoadsByPavementType,
          xAxisTitle: "Pavement Type",
          yAxisTitle: "Total Roads",
          chartName: "Total Number of Roads by Pavement Type",
          chartTitle: "Total Roads by Pavement Type",
        },
        {
          data: formattedRoadLengthDistribution,
          xAxisTitle: "Length Range",
          yAxisTitle: "Total Roads",
          chartName: "Road Length Distribution",
          chartTitle: "Road Length Distribution",
        },
        {
          data: formattedRoadWidthDistribution,
          xAxisTitle: "Width Range",
          yAxisTitle: "Total Roads",
          chartName: "Road Width Distribution",
          chartTitle: "Road Width Distribution",
        },
      ];

      // Send the response
      res.status(200).json({
        status: 200,
        success: true,
        message: "Road stats retrieved successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Error retrieving road stats:", error);
      next(error);
    }
  }

  async getPoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { ward } = req.query;

      // Base query to get poles in GeoJSON format
      let query = AppDataSource.getRepository(Pole)
        .createQueryBuilder("pole")
        .select(["pole.ogcFid", "pole.wkbGeometry", "pole.id", "pole.ward"])
        .addSelect(`ST_AsGeoJSON(pole.wkbGeometry) AS geometry`) // Convert geometry to GeoJSON format
        .where("pole.wkbGeometry IS NOT NULL"); // Ensure geometry exists

      // If ward is provided, filter poles that intersect with the ward boundary
      if (ward) {
        query = query
          .innerJoin(
            Ward,
            "ward",
            "ST_Intersects(pole.wkbGeometry, ward.geometry)"
          )
          .andWhere("ward.ward = :ward", { ward });
      }

      // Execute the query and fetch the results
      const poles = await query.getRawMany();

      // Structure the response in GeoJSON format
      const geoJson = {
        type: "FeatureCollection",
        features: poles.map((pole: any) => ({
          type: "Feature",
          geometry: JSON.parse(pole.geometry), // Parse GeoJSON geometry string
          properties: {
            ogcFid: pole.ogcFid,
            id: pole.id,
            ward: pole.ward,
          },
        })),
      };

      // Send the response as JSON
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Pole Data Retrieved Successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error fetching poles:", error);
      next(error);
    }
  }
}

export default new RoadController();
