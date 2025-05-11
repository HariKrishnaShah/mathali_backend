import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Ward } from "../entities/basic/Ward";
import HttpError from "../util/httpError";

class WardController {
  constructor(private wardRepo = AppDataSource.getRepository(Ward)) {}

  async getWard(req: Request, res: Response, next: NextFunction) {
    const wardId: any = req?.query?.ward; // Assuming ward ID is passed as a URL parameter

    try {
      if (!wardId) {
        // If no wardId is specified, fetch all wards
        const wards = await this.wardRepo.find();

        // Convert all wards to GeoJSON format
        const geoJsonFeatures = wards.map((ward) => ({
          type: "Feature",
          properties: {
            ward: ward.ward,
          },
          geometry: ward.geometry,
        }));

        const geoJson = {
          type: "FeatureCollection",
          features: geoJsonFeatures,
        };

        return res.status(200).json({
          status: 200,
          success: true,
          message: "All wards data retrieved successfully.",
          data: geoJson,
        });
      }

      // Fetch the specific ward by ID
      const ward = await this.wardRepo.findOne({
        where: { ward: wardId }, // Adjust this field based on your actual identifier
      });

      if (!ward) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Ward not found.",
        });
      }

      // Convert the specific ward to GeoJSON format
      const geoJson = {
        type: "Feature",
        properties: {
          ward: ward.ward,
        },
        geometry: ward.geometry,
      };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Ward data retrieved successfully.",
        data: geoJson,
      });
    } catch (error) {
      // Handle errors and send appropriate response
      console.error(error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: "An error occurred while retrieving ward data.",
      });
    }
  }
}

export default new WardController();
