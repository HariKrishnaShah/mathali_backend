import { AppDataSource } from "../config/database";
import { House } from "../entities/houseNumbering/House";
import { NextFunction, Request, Response } from "express";
import { Ward } from "../entities/basic/Ward";
import HttpError from "../util/httpError";
import { point } from "@turf/helpers"; // Import Turf.js helpers to work with geometry

class HouseController {
  constructor(
    private houseRepo = AppDataSource.getRepository(House),
    private wardRepo = AppDataSource.getRepository(Ward)
  ) {}
  async getHouses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { ward, block, owner, isNumberPlateInstalled } = req.query;

      // Build the base query for fetching houses
      let houseQuery = this.houseRepo.createQueryBuilder("house");

      // Apply the ward boundary filter if a ward number is provided
      if (ward) {
        const wardData = await this.wardRepo.findOne({
          where: { ward: Number(ward) },
        });

        if (!wardData || !wardData.geometry) {
          throw new HttpError(404, "Ward Boundary Not Found.");
        }

        // Add spatial filtering for houses within the ward boundary
        houseQuery = houseQuery.andWhere(
          "ST_Within(house.wkb_geometry, ST_GeomFromGeoJSON(:wardGeometry))",
          {
            wardGeometry: wardData.geometry,
          }
        );
      }

      if (isNumberPlateInstalled) {
        houseQuery = houseQuery.andWhere(
          "house.is_number_plate_installed = :isNumberPlateInstalled",
          { isNumberPlateInstalled }
        );
      }

      // Optionally filter by block if provided
      if (block) {
        houseQuery = houseQuery.andWhere("house.block = :block", { block });
      }

      // Optionally filter by owner if provided
      if (owner) {
        houseQuery = houseQuery.andWhere("house.owner ILIKE :owner", {
          owner: `%${owner}%`,
        });
      }

      // Execute the query and get houses
      const houses = await houseQuery
        .addSelect("ST_AsGeoJSON(house.wkb_geometry)", "geojson")
        .getRawMany();

      // Convert the data to GeoJSON format
      const geoJson = {
        type: "FeatureCollection",
        features: houses.map((house) => ({
          type: "Feature",
          geometry: JSON.parse(house.geojson), // Geometry is already in GeoJSON format
          properties: {
            ogcFid: house.house_ogc_fid,
            latitude: house.house_latitude,
            longitude: house.house_longitude,
            houseId: house.house_house_id,
            owner: house.house_owner,
            tole: house.house_tole,
            roadCode: house.house_road_code,
            block: house.house_block,
            xStarting: house.house_x_starting,
            yStarting: house.house_y_starting,
            distanceF: house.house_distance_f,
            rankFrom: house.house_rank_from,
            houseCode: house.house_house_code,
            googlePlu: house.house_google_plu,
            nameEnglish: house.house_name_english,
            nameNepali: house.house_name_nepali,
            ward: house.house_ward,
            numberPlateInstalled: house.house_is_number_plate_installed
              ? "Yes"
              : "No",
          },
        })),
      };

      // Return the GeoJSON data as the response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "House Point Data Retrieved Successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error fetching houses:", error);
      next(error);
    }
  }
  async getHouseByOgcFid(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { ogcFid } = req.params;

      // Find the house by ogcFid
      const house = await this.houseRepo
        .createQueryBuilder("house")
        .addSelect("ST_AsGeoJSON(house.wkb_geometry)", "geojson")
        .where("house.ogc_fid = :ogcFid", { ogcFid: Number(ogcFid) })
        .getRawOne();

      // If the house is not found, return a 404 response
      if (!house) {
        throw new HttpError(404, "House Not Found");
      }

      // Convert the data to GeoJSON format
      const geoJson = {
        type: "Feature",
        geometry: JSON.parse(house.geojson), // Geometry is already in GeoJSON format
        properties: {
          ogcFid: house.house_ogc_fid,
          latitude: house.house_latitude,
          longitude: house.house_longitude,
          houseId: house.house_house_id,
          owner: house.house_owner,
          tole: house.house_tole,
          roadCode: house.house_road_code,
          block: house.house_block,
          xStarting: house.house_x_starting,
          yStarting: house.house_y_starting,
          distanceF: house.house_distance_f,
          rankFrom: house.house_rank_from,
          houseCode: house.house_house_code,
          googlePlu: house.house_google_plu,
          nameEnglish: house.house_name_english,
          nameNepali: house.house_name_nepali,
          ward: house.house_ward,
        },
      };

      // Return the GeoJSON data as the response
      return res.json({
        status: 200,
        sucess: true,
        message: "House Data Found",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error fetching house:", error);
      next(error);
    }
  }
  async getHouseDetailsByOgcFid(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { ogcFid } = req.params;

      // Find the house by ogcFid
      const house = await this.houseRepo
        .createQueryBuilder("house")
        .where("house.ogc_fid = :ogcFid", { ogcFid: Number(ogcFid) })
        .getRawOne();

      // If the house is not found, return a 404 response
      if (!house) {
        throw new HttpError(404, "House Not Found");
      }

      // Convert the data to GeoJSON format

      // Return the GeoJSON data as the response
      return res.json({
        status: 200,
        sucess: true,
        message: "House Data Found",
        data: house,
      });
    } catch (error) {
      console.error("Error fetching house:", error);
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;

      const block = req.query.block as string;
      const ward = req.query.ward as string;
      const owner = req.query.owner as string;
      const houseCode = req.query.houseCode as string; // Add houseCode filter

      // Build query with search conditions
      const query = this.houseRepo
        .createQueryBuilder("house")
        .select([
          "house.ogcFid",
          "house.houseId",
          "house.owner",
          "house.tole",
          "house.roadCode",
          "house.block",
          "house.houseCode",
          "house.ward",
          "house.nameEnglish",
          "house.nameNepali",
          "house.wkbGeometry",
        ])
        .where("1 = 1");

      // Add search/filter conditions
      if (block) {
        query.andWhere("house.block = :block", { block });
      }

      if (ward) {
        query.andWhere("house.ward = :ward", { ward });
      }

      if (owner) {
        query.andWhere("house.owner LIKE :owner", { owner: `%${owner}%` });
      }

      if (houseCode) {
        query.andWhere("house.houseCode = :houseCode", { houseCode }); // House code filter
      }

      // Add sorting in descending order by ogcFid
      query.orderBy("house.ogcFid", "DESC");

      // Pagination logic
      const [houses, totalItems] = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Iterate through houses to derive longitude and latitude from wkbGeometry
      const housesWithCoordinates = houses.map((house: any) => {
        let longitude = null;
        let latitude = null;

        // Derive longitude and latitude from wkbGeometry
        if (house.wkbGeometry) {
          longitude = house.wkbGeometry.coordinates[0];
          latitude = house.wkbGeometry.coordinates[1];
        }
        const { wkbGeometry, ...rest } = house;

        return {
          ...rest,
          longitude,
          latitude,
        };
      });

      // Send paginated data in response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "House data retrieved successfully.",
        data: housesWithCoordinates,
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
      const { ogcFid } = req.params; // Assuming ogcFid is passed as a URL parameter
      const {
        houseId,
        owner,
        tole,
        roadCode,
        block,
        houseCode,
        googlePlu,
        nameEnglish,
        nameNepali,
        ward,
        longitude,
        latitude,
      } = req.body;

      // Find the house by ogcFid
      const house: any = await this.houseRepo.findOne({
        where: { ogcFid: Number(ogcFid) },
      });

      if (!house) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "House not found.",
        });
      }

      // Update fields except restricted ones
      house.houseId = houseId ?? house.houseId;
      house.owner = owner ?? house.owner;
      house.tole = tole ?? house.tole;
      house.roadCode = roadCode ?? house.roadCode;
      house.block = block ?? house.block;
      house.houseCode = houseCode ?? house.houseCode;
      house.googlePlu = googlePlu ?? house.googlePlu;
      house.nameEnglish = nameEnglish ?? house.nameEnglish;
      house.nameNepali = nameNepali ?? house.nameNepali;
      house.ward = ward ?? house.ward;

      // If longitude and latitude are provided, update wkbGeometry
      if (longitude !== undefined && latitude !== undefined) {
        house.wkbGeometry.coordinates[0] = longitude;
        house.wkbGeometry.coordinates[1] = latitude;
      }

      // Save the updated house entity
      await this.houseRepo.save(house);

      return res.status(200).json({
        status: 200,
        success: true,
        message: "House data updated successfully.",
        data: house,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const ward = req.query.ward as string | undefined;
      const houseRepository = AppDataSource.getRepository(House);

      // =========================
      // 1) Ward-Level Statistics
      // =========================
      // - totalHouses
      // - averageDistance
      // - averageRank
      // all grouped by "ward"
      const wardStatsQuery = houseRepository
        .createQueryBuilder("house")
        .select("house.ward", "ward")
        .addSelect("COUNT(*)", "totalHouses")
        .addSelect("AVG(house.distanceF)", "averageDistance")
        .addSelect("AVG(house.rankFrom)", "averageRank")
        .groupBy("house.ward");

      if (ward) {
        wardStatsQuery.where("house.ward = :ward", { ward });
      }

      // ==============================
      // 2) Houses by Tole (group by tole)
      // ==============================
      const toleStatsQuery = houseRepository
        .createQueryBuilder("house")
        .select("house.tole", "tole")
        .addSelect("COUNT(*)", "totalHouses")
        .groupBy("house.tole");

      if (ward) {
        toleStatsQuery.where("house.ward = :ward", { ward });
      }

      // ===============================
      // 3) Houses by Block (group by block)
      // ===============================
      const blockStatsQuery = houseRepository
        .createQueryBuilder("house")
        .select("house.block", "block")
        .addSelect("COUNT(*)", "totalHouses")
        .groupBy("house.block");

      if (ward) {
        blockStatsQuery.where("house.ward = :ward", { ward });
      }

      // =========================================
      // Execute all queries in parallel
      // =========================================
      const [wardStats, toleStats, blockStats] = await Promise.all([
        wardStatsQuery.getRawMany(),
        toleStatsQuery.getRawMany(),
        blockStatsQuery.getRawMany(),
      ]);

      // =========================================
      // Transform data for each chart
      // =========================================

      // A) Stats by Ward (totalHouses, avgDistance, avgRank)
      const formattedWardStats = wardStats.map((row: any) => ({
        ward: row.ward || "All Wards",
        totalHouses: parseInt(row.totalHouses, 10) || 0,
        averageDistance: parseFloat(row.averageDistance) || 0,
        averageRank: parseFloat(row.averageRank) || 0,
      }));

      // B) Houses by Tole
      const formattedToleStats = toleStats.map((row: any) => ({
        tole: row.tole || "Unknown Tole",
        totalHouses: parseInt(row.totalHouses, 10) || 0,
      }));

      // C) Houses by Block
      const formattedBlockStats = blockStats.map((row: any) => ({
        block: row.block || "Unknown Block",
        totalHouses: parseInt(row.totalHouses, 10) || 0,
      }));

      // =========================================
      // Build the final response structure
      // =========================================
      const responseData = [
        // 1. Total Houses (by Ward)
        {
          data: formattedWardStats.map((item) => ({
            ward: item.ward,
            totalHouses: item.totalHouses,
          })),
          xAxisTitle: "Ward",
          yAxisTitle: "Total Houses",
          chartName: "Total Number of Houses",
          chartTitle: "Total Houses by Ward",
        },
        // 2. Houses by Block
        {
          data: formattedBlockStats.map((item) => ({
            block: item.block,
            totalHouses: item.totalHouses,
          })),
          xAxisTitle: "Block",
          yAxisTitle: "Total Houses",
          chartName: "Total Number of Houses by Block",
          chartTitle: "Total Houses by Block",
        },
        // 3. Average Distance by Ward
        {
          data: formattedWardStats.map((item) => ({
            ward: item.ward,
            averageDistance: Number(item.averageDistance.toFixed(0)),
          })),
          xAxisTitle: "Ward",
          yAxisTitle: "Average Distance (m)",
          chartName: "Average Distance in meters",
          chartTitle: "Avg Distance of House from road (meter)",
        },
        // 4. Average Rank by Ward
        {
          data: formattedWardStats.map((item) => ({
            ward: item.ward,
            averageRank: Number(item.averageRank.toFixed(0)),
          })),
          xAxisTitle: "Ward",
          yAxisTitle: "Average Rank",
          chartName: "Average Rank",
          chartTitle: "Average Rank of Houses by Ward",
        },
        // 5. Houses by Tole
        {
          data: formattedToleStats.map((item) => ({
            tole: item.tole,
            totalHouses: Number(item.totalHouses.toFixed(0)),
          })),
          xAxisTitle: "Tole",
          yAxisTitle: "Total Houses",
          chartName: "Total Number of Houses by Tole",
          chartTitle: "Total Houses by Tole",
        },
      ];

      // Filter out any sections that have no data
      const filteredResponseData = responseData.filter(
        (section) => section.data && section.data.length > 0
      );

      // Send JSON response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "House stats retrieved successfully",
        data: filteredResponseData,
      });
    } catch (error) {
      console.error("Error retrieving house stats:", error);
      next(error);
    }
  }

  async checkHouseGooglePlusValidity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const googlePlusCode = String(req.params.google_plus_code);

      // Check if houseId exists in the database
      const house = await this.houseRepo.findOne({
        where: { googlePlu: googlePlusCode },
      });

      if (!house) {
        throw new HttpError(
          404,
          `House with Google Plus Code ${googlePlusCode} not found`
        );
      }

      // If houseId is valid, return success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: `House with Google Plus Code ${googlePlusCode} is valid.`,
        data: { googlePlusCode },
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleIsNumberPlateInstalled(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { ogcFid } = req.params;
      const { isNumberPlateInstalled } = req.query;

      if (
        isNumberPlateInstalled != "true" &&
        isNumberPlateInstalled != "false"
      ) {
        throw new HttpError(
          400,
          "Status of house number plate installed can only be true or false."
        );
      }

      const status = isNumberPlateInstalled == "true" ? true : false;

      if (!ogcFid) {
        throw new HttpError(400, "ogcFid is missing.");
      }

      const house = await this.houseRepo.findOneBy({ ogcFid: Number(ogcFid) });
      if (!house) {
        throw new HttpError(404, "House not found.");
      }
      house.isNumberPlateInstalled = status;
      const updatedHouse = await this.houseRepo.save(house);
      res.json({
        status: 200,
        message: `House Number Plate Status updated to ${status}`,
        data: updatedHouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNumberPlateStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Query for overall statistics
      const overallStats = await this.houseRepo
        .createQueryBuilder("house")
        .select([
          "COUNT(*)::integer as totalHouses",
          "SUM(CASE WHEN house.isNumberPlateInstalled THEN 1 ELSE 0 END)::integer as housesWithPlates",
        ])
        .getRawOne();

      const totalHouses = overallStats.totalhouses || 0;
      const housesWithPlates = overallStats.houseswithplates || 0;

      // Query for ward-wise statistics
      const wardStats = await this.houseRepo
        .createQueryBuilder("house")
        .select([
          "ward.ward AS wardNumber",
          "COUNT(*)::integer AS totalHouses",
          "SUM(CASE WHEN house.isNumberPlateInstalled THEN 1 ELSE 0 END)::integer AS housesWithPlates",
        ])
        .innerJoin(Ward, "ward", "ST_Within(house.wkbGeometry, ward.geometry)")
        .groupBy("ward.ward")
        .orderBy("ward.ward", "ASC")
        .getRawMany();

      // Calculate ward completion rates
      const wardStatistics = wardStats.map((stat) => ({
        wardNumber: stat.wardnumber,
        totalHouses: stat.totalhouses || 0,
        housesWithPlates: stat.houseswithplates || 0,
      }));

      const stats = {
        totalHouses,
        housesWithPlates,
        wardStatistics,
      };

      // Return the result
      res.json({
        status: 200,
        success: true,
        message: "Stats retreived successfully.",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new HouseController();
