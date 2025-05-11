import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Cadastral } from "../entities/cadastral/Cadastral";
import { Ward } from "../entities/basic/Ward";
import { CadastralPoints } from "../entities/cadastral/CadastralPoints";
import HttpError from "../util/httpError";

class LandCadastral {
  constructor(
    private landCadastralRepo = AppDataSource.getRepository(Cadastral),
    private wardRepo = AppDataSource.getRepository(Ward),
    private landCadastralPointRepo = AppDataSource.getRepository(
      CadastralPoints
    )
  ) {}

  async getCadastral(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        zone,
        ward,
        sheet_no,
        parcel_no,
        withDetails,
        withValuation,
        valuation0To10Lakh,
        valuation10To50Lakh,
        valuation5LakhTo1Crore,
        valuation1CroreTo2Crore,
        valuation2To4Crore,
        valuation5CrorePlus,
        tolerance = 0.0, // Default tolerance for simplification
      } = req.query;

      let query = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select(
          `ST_AsGeoJSON(ST_SimplifyPreserveTopology(cadastral.wkbGeometry, :tolerance))`,
          "geometry"
        )
        .addSelect("cadastral.parcelNo", "parcelNo")
        .setParameter("tolerance", Number(tolerance));
      query.addSelect("cadastral.zone", "zone");
      if (withDetails === "true") {
        query = query
          .addSelect("cadastral.wardNo", "wardNo")
          .addSelect("cadastral.sheetNo", "sheetNo")
          .addSelect("cadastral.zone", "zone")
          .addSelect("cadastral.formerVdc", "formerVdc")
          .addSelect("cadastral.remarks", "remarks")
          .addSelect("cadastral.zoneNepali", "zoneNepali");
      }
      if (withValuation === "true") {
        query = query.addSelect("cadastral.valuation", "valuation");
      }

      // Filter by valuation ranges
      if (valuation0To10Lakh === "true") {
        query = query.andWhere("cadastral.valuation BETWEEN 0 AND 1000000");
      }
      if (valuation10To50Lakh === "true") {
        query = query.andWhere(
          "cadastral.valuation BETWEEN 1000000 AND 5000000"
        );
      }
      if (valuation5LakhTo1Crore === "true") {
        query = query.andWhere(
          "cadastral.valuation BETWEEN 5000000 AND 10000000"
        );
      }
      if (valuation1CroreTo2Crore === "true") {
        query = query.andWhere(
          "cadastral.valuation BETWEEN 10000000 AND 20000000"
        );
      }
      if (valuation2To4Crore === "true") {
        query = query.andWhere(
          "cadastral.valuation BETWEEN 20000000 AND 40000000"
        );
      }
      if (valuation5CrorePlus === "true") {
        query = query.andWhere("cadastral.valuation > 50000000");
      }

      // Apply other filters (zone, sheet_no, parcel_no, ward)
      if (zone) {
        query = query.andWhere("cadastral.zone = :zone", { zone });
      }
      if (sheet_no) {
        query = query.andWhere("cadastral.sheetNo = :sheet_no", { sheet_no });
      }
      if (parcel_no) {
        query = query.andWhere("cadastral.parcelNo = :parcel_no", {
          parcel_no,
        });
      }
      if (ward) {
        query = query
          .innerJoin(Ward, "ward", "ward.ward = :ward", { ward })
          .andWhere("ST_Intersects(cadastral.wkbGeometry, ward.geometry)");
      }

      const cadastralData = await query.getRawMany();
      const geoJson = {
        type: "FeatureCollection",
        features: cadastralData.map((data) => ({
          type: "Feature",
          geometry: JSON.parse(data.geometry),
          properties:
            withDetails === "true"
              ? {
                  parcelNo: data.parcelNo,
                  wardNo: data.wardNo,
                  sheetNo: data.sheetNo,
                  zone: data.zone,
                  formerVdc: data.formerVdc,
                  zoneNepali: data.zoneNepali,
                  remarks: data.remarks,
                  ...(withValuation === "true" && {
                    valuation: data.valuation,
                  }),
                }
              : {
                  parcelNo: data.parcelNo,
                  zone: data.zone,
                },
        })),
      };

      res.status(200).json({
        status: 200,
        success: true,
        message: "Land Cadastral Retrieved successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error in getCadastral:", error);
      next(error);
    }
  }

  async getCadastralForTaxModule(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        showAgricultureSheets,
        showResidentialSheets,
        showCommercialSheets,
        showIndustrialSheets,
        showPublicUseSheets,
        showWaterBodiesSheets,
        showForestSheets,
        ward,
        sheet_no,
        parcel_no,
        withDetails,
        withValuation,
        valuation0To10Lakh,
        valuation10To50Lakh,
        valuation50LakhTo1Crore,
        valuation1CroreTo2Crore,
        valuation2To4Crore,
        valuation5CrorePlus,
        tolerance = 0.0, // Default tolerance for geometry simplification
      } = req.query;

      // Zones filter
      const zones = [];
      if (showAgricultureSheets === "true") zones.push("Agricultural");
      if (showResidentialSheets === "true") zones.push("Residential");
      if (showCommercialSheets === "true") zones.push("Commercial");
      if (showForestSheets === "true") zones.push("Forest");
      if (showWaterBodiesSheets === "true") zones.push("Riverine and Lakes");
      if (showIndustrialSheets === "true") zones.push("Industrial");
      if (showPublicUseSheets === "true") zones.push("Public Use");

      // Ensure at least one filter is applied
      const hasZoneOrValuationFilter =
        zones.length > 0 ||
        [
          valuation0To10Lakh,
          valuation10To50Lakh,
          valuation50LakhTo1Crore,
          valuation1CroreTo2Crore,
          valuation2To4Crore,
          valuation5CrorePlus,
        ].some((filter) => filter === "true");

      if (!hasZoneOrValuationFilter) {
        throw new HttpError(
          400,
          "Select at least one zone or valuation range to view GeoJSON."
        );
      }

      // Base query with simplified geometry
      let query = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select(
          `ST_AsGeoJSON(ST_SimplifyPreserveTopology(cadastral.wkbGeometry, :tolerance))`,
          "geometry"
        )
        .addSelect("cadastral.parcelNo", "parcelNo")
        .setParameter("tolerance", Number(tolerance));

      // Add details if requested
      if (withDetails === "true") {
        query.addSelect([
          "cadastral.wardNo",
          "cadastral.sheetNo",
          "cadastral.zone",
          "cadastral.formerVdc",
          "cadastral.remarks",
        ]);
      }

      if (withValuation === "true") {
        query.addSelect("cadastral.valuation", "valuation");
      }

      // Valuation ranges
      const valuationFilters = [
        {
          condition: valuation0To10Lakh === "true",
          query: "cadastral.valuation BETWEEN 0 AND 1000000",
        },
        {
          condition: valuation10To50Lakh === "true",
          query: "cadastral.valuation BETWEEN 1000000 AND 5000000",
        },
        {
          condition: valuation50LakhTo1Crore === "true",
          query: "cadastral.valuation BETWEEN 5000000 AND 10000000",
        },
        {
          condition: valuation1CroreTo2Crore === "true",
          query: "cadastral.valuation BETWEEN 10000000 AND 20000000",
        },
        {
          condition: valuation2To4Crore === "true",
          query: "cadastral.valuation BETWEEN 20000000 AND 40000000",
        },
        {
          condition: valuation5CrorePlus === "true",
          query: "cadastral.valuation > 50000000",
        },
      ];

      valuationFilters.forEach(({ condition, query: valQuery }) => {
        if (condition) query.andWhere(valQuery);
      });

      // Zone filter
      if (zones.length > 0) {
        query.andWhere("cadastral.zone IN (:...zones)", { zones });
      }

      // Other filters
      if (sheet_no)
        query.andWhere("cadastral.sheetNo = :sheet_no", { sheet_no });
      if (parcel_no)
        query.andWhere("cadastral.parcelNo = :parcel_no", { parcel_no });

      // Ward filter
      if (ward) {
        query
          .innerJoin(Ward, "ward", "ward.ward = :ward", { ward })
          .andWhere("ST_Intersects(cadastral.wkbGeometry, ward.geometry)");
      }

      // Execute query
      const cadastralData = await query.getRawMany();
      // Construct GeoJSON
      const geoJson = {
        type: "FeatureCollection",
        features: cadastralData.map((data) => ({
          type: "Feature",
          geometry: JSON.parse(data.geometry),
          properties: {
            parcelNo: data.parcelNo,
            ...(withDetails === "true" && {
              wardNo: data.cadastral_ward_no,
              sheetNo: data.cadastral_sheet_no,
              zone: data.cadastral_zone,
              formerVdc: data.cadastral_former_vdc,
              remarks: data.cadastral_remarks,
            }),
            ...(withValuation === "true" && { valuation: data.valuation }),
          },
        })),
      };

      // Send response
      res.status(200).json({
        status: 200,
        success: true,
        message: "Land Cadastral Retrieved successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error in getCadastralForTaxModule:", error);
      next(error);
    }
  }

  async getCadastralPointForTaxModule(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        showAgricultureSheets,
        showResidentialSheets,
        showCommercialSheets,
        showIndustrialSheets,
        showPublicUseSheets,
        showWaterBodiesSheets,
        showForestSheets,
        ward,
        sheet_no,
        parcel_no,
        withDetails,
        withValuation,
        valuation0To10Lakh,
        valuation10To50Lakh,
        valuation50LakhTo1Crore,
        valuation1CroreTo2Crore,
        valuation2To4Crore,
        valuation5CrorePlus,
        tolerance = 0.0, // Default tolerance for geometry simplification
      } = req.query;

      // Zones filter
      const zones = [];
      if (showAgricultureSheets === "true") zones.push("Agricultural");
      if (showResidentialSheets === "true") zones.push("Residential");
      if (showCommercialSheets === "true") zones.push("Commercial");
      if (showForestSheets === "true") zones.push("Forest");
      if (showWaterBodiesSheets === "true") zones.push("Riverine and Lakes");
      if (showIndustrialSheets === "true") zones.push("Industrial");
      if (showPublicUseSheets === "true") zones.push("Public Use");

      // Ensure at least one filter is applied
      const hasZoneOrValuationFilter =
        zones.length > 0 ||
        [
          valuation0To10Lakh,
          valuation10To50Lakh,
          valuation50LakhTo1Crore,
          valuation1CroreTo2Crore,
          valuation2To4Crore,
          valuation5CrorePlus,
        ].some((filter) => filter === "true");

      if (!hasZoneOrValuationFilter) {
        throw new HttpError(
          400,
          "Select at least one zone or valuation range to view GeoJSON."
        );
      }

      // Base query with simplified geometry
      let query = this.landCadastralPointRepo
        .createQueryBuilder("cadastral")
        .select(
          `ST_AsGeoJSON(ST_SimplifyPreserveTopology(cadastral.wkbGeometry, :tolerance))`,
          "geometry"
        )
        .addSelect("cadastral.parcelNo", "parcelNo")
        .setParameter("tolerance", Number(tolerance));

      // Add additional details if requested
      if (withDetails === "true") {
        query.addSelect([
          "cadastral.wardNo",
          "cadastral.sheetNo",
          "cadastral.zone",
          "cadastral.formerVdc",
          "cadastral.remarks",
        ]);
      }

      if (withValuation === "true") {
        query.addSelect("cadastral.valuation", "valuation");
      }

      // Valuation ranges
      const valuationFilters = [
        {
          condition: valuation0To10Lakh === "true",
          query: "cadastral.valuation BETWEEN 0 AND 1000000",
        },
        {
          condition: valuation10To50Lakh === "true",
          query: "cadastral.valuation BETWEEN 1000000 AND 5000000",
        },
        {
          condition: valuation50LakhTo1Crore === "true",
          query: "cadastral.valuation BETWEEN 5000000 AND 10000000",
        },
        {
          condition: valuation1CroreTo2Crore === "true",
          query: "cadastral.valuation BETWEEN 10000000 AND 20000000",
        },
        {
          condition: valuation2To4Crore === "true",
          query: "cadastral.valuation BETWEEN 20000000 AND 40000000",
        },
        {
          condition: valuation5CrorePlus === "true",
          query: "cadastral.valuation > 50000000",
        },
      ];

      valuationFilters.forEach(({ condition, query: valQuery }) => {
        if (condition) query.andWhere(valQuery);
      });

      // Zone filter
      if (zones.length > 0) {
        query.andWhere("cadastral.zone IN (:...zones)", { zones });
      }

      // Other filters
      if (sheet_no)
        query.andWhere("cadastral.sheetNo = :sheet_no", { sheet_no });
      if (parcel_no)
        query.andWhere("cadastral.parcelNo = :parcel_no", { parcel_no });

      // Ward filter
      if (ward) {
        query
          .innerJoin(Ward, "ward", "ward.ward = :ward", { ward })
          .andWhere("ST_Intersects(cadastral.wkbGeometry, ward.geometry)");
      }

      // Execute query
      const cadastralData = await query.getRawMany();

      // Construct GeoJSON
      const geoJson = {
        type: "FeatureCollection",
        features: cadastralData.map((data) => ({
          type: "Feature",
          geometry: JSON.parse(data.geometry),
          properties: {
            parcelNo: data.parcelNo,
            ...(withDetails === "true" && {
              wardNo: data.cadastral_ward_no,
              sheetNo: data.cadastral_sheet_no,
              zone: data.cadastral_zone,
              formerVdc: data.cadastral_former_vdc,
              remarks: data.cadastral_remarks,
            }),
            ...(withValuation === "true" && { valuation: data.valuation }),
          },
        })),
      };

      // Send response
      res.status(200).json({
        status: 200,
        success: true,
        message: "Land Cadastral Retrieved successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error in getCadastralPointForTaxModule:", error);
      next(error);
    }
  }

  async getCadastralById(req: Request, res: Response, next: NextFunction) {
    try {
      const { ogcFid } = req.params;
      const { withValuation } = req.query; // Extract withValuation from query params

      // Fetch the cadastral entry by ogcFid
      const cadastral = await this.landCadastralRepo.findOneBy({
        ogcFid: Number(ogcFid),
      });

      if (cadastral) {
        // Prepare GeoJSON object
        const geojson: any = {
          type: "Feature",
          geometry: cadastral.wkbGeometry, // Assuming it's already in GeoJSON format
          properties: {
            ogcFid: cadastral.ogcFid,
            parcelNo: cadastral.parcelNo,
            wardNo: cadastral.wardNo,
            shapeArea: cadastral.shapeArea,
            sheetNo: cadastral.sheetNo,
            zoneEng: cadastral.zone,
            zoneNepali: cadastral.zoneNepali,
            formerVdc: cadastral.formerVdc,
            remarks: cadastral.remarks,
            // Conditionally include valuation if 'withValuation' is true
            ...(withValuation === "true" && { valuation: cadastral.valuation }),
          },
        };

        return res.status(200).json({
          status: 200,
          success: true,
          message: `GeoJSON data for the Id ${ogcFid} retrieved successfully`,
          data: geojson,
        });
      } else {
        return res.status(404).json({ message: "Cadastral entry not found." });
      }
    } catch (error) {
      next(error);
      console.error("Error fetching cadastral:", error);
    }
  }

  async getCadastralPointById(req: Request, res: Response, next: NextFunction) {
    try {
      const { ogcFid } = req.params;
      const { withValuation } = req.query; // Extract withValuation from query params

      // Fetch the cadastral entry by ogcFid
      const cadastral = await this.landCadastralPointRepo.findOneBy({
        ogcFid: Number(ogcFid),
      });

      if (cadastral) {
        const { valuation, ...rest } = cadastral;
        const responseData: any = {
          status: 200,
          success: true,
          message: `Geojson Point data for the Id ${ogcFid} retrieved successfully`,
          data: rest,
        };

        // Only include valuation if 'withValuation' is explicitly "true"
        if (withValuation === "true") {
          responseData.data.valuation = cadastral.valuation;
        }

        return res.status(200).json(responseData);
      } else {
        return res.status(404).json({ message: "Cadastral entry not found." });
      }
    } catch (error) {
      next(error);
      console.error("Error fetching cadastral:", error);
    }
  }

  async updateCadastral(req: Request, res: Response, next: NextFunction) {
    try {
      const { ogcFid } = req.params; // Assuming ogcFid comes from the request params
      const {
        wardNo,
        zone,
        formerVdc,
        remarks,
        parcelNo,
        sheetNo,
        valuation,
        zoneNepali,
      } = req.body; // Data from the request body
      const { withValuation } = req.query; // Extract withValuation from query params

      // Find the cadastral record by ogcFid
      const cadastral = await this.landCadastralRepo.findOneBy({
        ogcFid: parseInt(ogcFid),
      });
      const cadastralPoint = await this.landCadastralPointRepo.findOneBy({
        ogcFid: parseInt(ogcFid),
      });

      if (!cadastral) {
        return res.status(404).json({ message: "Cadastral record not found" });
      }
      if (!cadastralPoint) {
        return res
          .status(404)
          .json({ message: "Cadastral point record not found" });
      }

      // Update the cadastral fields
      cadastral.wardNo = wardNo ?? cadastral.wardNo; // Update only if provided
      cadastral.zone = zone ?? cadastral.zone;
      cadastral.formerVdc = formerVdc ?? cadastral.formerVdc;
      cadastral.remarks = remarks ?? cadastral.remarks;
      cadastral.parcelNo = parcelNo ?? cadastral.parcelNo;
      cadastral.sheetNo = sheetNo ?? cadastral.sheetNo;
      cadastral.zoneNepali = zoneNepali ?? cadastral.zoneNepali;

      //update the point data
      cadastralPoint.wardNo = wardNo ?? cadastralPoint.wardNo; // Update only if provided
      cadastralPoint.zone = zone ?? cadastralPoint.zone;
      cadastralPoint.formerVdc = formerVdc ?? cadastralPoint.formerVdc;
      cadastralPoint.remarks = remarks ?? cadastralPoint.remarks;
      cadastralPoint.parcelNo = parcelNo ?? cadastralPoint.parcelNo;
      cadastralPoint.sheetNo = sheetNo ?? cadastralPoint.sheetNo;
      cadastralPoint.zoneNepali = zoneNepali ?? cadastralPoint.zoneNepali;

      // Allow updating valuation if 'withValuation' is explicitly "true"
      if (withValuation === "true") {
        cadastral.valuation = valuation ?? cadastral.valuation; // Update valuation if provided
        cadastralPoint.valuation = valuation ?? cadastralPoint.valuation; // Update valuation if provided
      }

      // Save the updated cadastral record
      await this.landCadastralRepo.save(cadastral);
      await this.landCadastralPointRepo.save(cadastralPoint);

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Cadastral updated successfully",
        data: cadastral,
      });
    } catch (error) {
      console.error("Error updating cadastral:", error);
      next(error); // Pass the error to the global error handler
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const { withValuation } = req.query;

      const parcelNo = req.query.parcelNo as string;
      const sheetNo = req.query.sheetNo as string;
      const wardNo = req.query.wardNo as string;
      const formerVdc = req.query.formerVdc as string;
      const zone = req.query.zone as string;
      const minArea = parseFloat(req.query.minArea as string) || -Infinity;
      const maxArea = parseFloat(req.query.maxArea as string) || Infinity;

      // Extract sort order parameter
      const sortOrderAsc = req.query.sortOrderAsc === "true"; // If 'true', sort ascending

      // Sort parameters
      const sortBy = (req.query.sortBy as string) || "ogcFid"; // Default to sorting by 'ogcFid'
      const sortOrder = sortOrderAsc ? "ASC" : "DESC"; // Determine sort order based on sortOrderAsc

      // Validate sortBy
      const validSortBy = ["ogcFid", "shapeArea"];

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
      const query = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select([
          "cadastral.ogcFid",
          "cadastral.parcelNo",
          "cadastral.wardNo",
          "cadastral.shapeArea",
          "cadastral.sheetNo",
          "cadastral.zone",
          "cadastral.formerVdc",
          "cadastral.remarks",
          "cadastral.zoneNepali",
        ])
        .where("1 = 1");

      if (withValuation === "true") {
        query.addSelect(["cadastral.valuation"]);
      }

      // Add search/filter conditions
      if (parcelNo) {
        query.andWhere("cadastral.parcelNo = :parcelNo", { parcelNo });
      }

      if (sheetNo) {
        // If no parcelNo provided, search by sheetNo
        query.andWhere("cadastral.sheetNo = :sheetNo", { sheetNo });
      }

      if (wardNo) {
        query.andWhere("cadastral.wardNo = :wardNo", { wardNo });
      }

      if (formerVdc) {
        query.andWhere("cadastral.formerVdc = :formerVdc", { formerVdc });
      }

      if (zone) {
        query.andWhere("cadastral.zone = :zone", { zone });
      }
      // Add conditions for minArea and maxArea dynamically
      if (!isNaN(minArea) && minArea !== -Infinity) {
        query.andWhere("cadastral.shapeArea >= :minArea", { minArea });
      }

      if (!isNaN(maxArea) && maxArea !== Infinity) {
        query.andWhere("cadastral.shapeArea <= :maxArea", { maxArea });
      }

      // Sorting logic based on sortBy and sortOrder
      query.orderBy(`cadastral.${sortBy}`, sortOrder);

      // Pagination logic
      const [cadastrals, totalItems] = await query
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
        message: "Cadastral data retrieved successfully.",
        data: cadastrals,
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

  async getAllPointData(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        zone,
        ward,
        sheet_no,
        parcel_no,
        withDetails,
        withValuation,
        tolerance = 0.0, // Default tolerance for geometry simplification
      } = req.query;

      // Base query with simplified geometry
      let query = this.landCadastralPointRepo
        .createQueryBuilder("cadastralPoints")
        .select(
          `ST_AsGeoJSON(ST_SimplifyPreserveTopology(cadastralPoints.wkbGeometry, :tolerance))`,
          "geometry"
        )
        .addSelect("cadastralPoints.parcelNo", "parcelNo")
        .setParameter("tolerance", Number(tolerance));

      // Add additional details if requested
      if (withDetails === "true") {
        query.addSelect([
          "cadastralPoints.wardNo",
          "cadastralPoints.sheetNo",
          "cadastralPoints.zone",
          "cadastralPoints.formerVdc",
          "cadastralPoints.remarks",
          "cadastralPoints.zoneNepali",
        ]);
      }

      if (withValuation === "true") {
        query.addSelect("cadastralPoints.valuation", "valuation");
      }

      // Valuation ranges filter
      const valuationRanges = {
        valuation0To10Lakh: "cadastralPoints.valuation BETWEEN 0 AND 1000000",
        valuation10To50Lakh:
          "cadastralPoints.valuation BETWEEN 1000000 AND 5000000",
        valuation5LakhTo1Crore:
          "cadastralPoints.valuation BETWEEN 5000000 AND 10000000",
        valuation1CroreTo2Crore:
          "cadastralPoints.valuation BETWEEN 10000000 AND 20000000",
        valuation2To4Crore:
          "cadastralPoints.valuation BETWEEN 20000000 AND 40000000",
        valuation5CrorePlus: "cadastralPoints.valuation > 50000000",
      };

      Object.entries(valuationRanges).forEach(([key, condition]) => {
        if (req.query[key] === "true") {
          query.andWhere(condition);
        }
      });

      // Other filters
      if (zone) query.andWhere("cadastralPoints.zone = :zone", { zone });
      if (sheet_no)
        query.andWhere("cadastralPoints.sheetNo = :sheet_no", { sheet_no });
      if (parcel_no)
        query.andWhere("cadastralPoints.parcelNo = :parcel_no", { parcel_no });

      if (ward) {
        query
          .innerJoinAndSelect(Ward, "ward", "ward.ward = :ward", { ward })
          .andWhere(
            "ST_Intersects(cadastralPoints.wkbGeometry, ward.geometry)"
          );
      }

      // Execute the query
      const cadastralPointData = await query.getRawMany();
      // Construct GeoJSON
      const geoJson = {
        type: "FeatureCollection",
        features: cadastralPointData.map((data) => ({
          type: "Feature",
          geometry: JSON.parse(data.geometry),
          properties: {
            parcelNo: data.parcelNo,
            ...(withDetails === "true" && {
              wardNo: data.cadastralPoints_ward_no,
              sheetNo: data.cadastralPoints_sheet_no,
              zone: data.cadastralPoints_zone,
              zoneNepali: data.cadastralPoints_zone_nepali,
              formerVdc: data.cadastralPoints_former_vdc,
              remarks: data.cadastralPoints_remarks,
            }),
            ...(withValuation === "true" && { valuation: data.valuation }),
          },
        })),
      };

      // Send response
      res.status(200).json({
        status: 200,
        success: true,
        message: "Cadastral points data retrieved successfully",
        data: geoJson,
      });
    } catch (error) {
      console.error("Error in getAllPointData:", error);
      next(error);
    }
  }

  async getSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const { ward } = req.query;

      // Build the query
      let query = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("DISTINCT cadastral.sheetNo", "sheetNo")
        .where("cadastral.sheetNo IS NOT NULL");

      // If a ward is provided, add a condition for the ward
      if (ward) {
        query = query.andWhere("cadastral.wardNo = :ward", { ward });
      }

      // Execute the query to get distinct sheet numbers
      const sheetNumbers = await query.getRawMany();

      // Format the result
      const result = sheetNumbers.map((row) => row.sheetNo);

      // Respond with the distinct sheet numbers
      res.status(200).json({
        status: 200,
        success: true,
        message: "Sheet numbers retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in getSheets:", error);
      next(error);
    }
  }
  async getParcels(req: Request, res: Response, next: NextFunction) {
    try {
      const { ward, sheet } = req.query;

      // Build the query to select distinct parcel numbers
      let query = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("DISTINCT cadastral.parcelNo", "parcelNo")
        .where("cadastral.parcelNo IS NOT NULL");

      // Case 1: If both ward and sheet are present
      if (ward && sheet) {
        query = query
          .andWhere("cadastral.wardNo = :ward", { ward })
          .andWhere("cadastral.sheetNo = :sheet", { sheet });
      }
      // Case 2: If only ward is present
      else if (ward) {
        query = query.andWhere("cadastral.wardNo = :ward", { ward });
      }
      // Case 3: If only sheet is present
      else if (sheet) {
        query = query.andWhere("cadastral.sheetNo = :sheet", { sheet });
      }

      // Execute the query to get distinct parcel numbers
      const parcelNumbers = await query.getRawMany();

      // Format the result as an array of parcel numbers
      const result = parcelNumbers.map((row) => row.parcelNo);

      // Respond with the distinct parcel numbers
      res.status(200).json({
        status: 200,
        success: true,
        message: "Parcel numbers retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in getParcels:", error);
      next(error);
    }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const ward = req.query.ward as string | undefined;

      // 1. Total Parcel Count by Zones
      const parcelCountQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("COUNT(cadastral.parcelNo)", "totalParcels")
        .groupBy("cadastral.zone");

      if (ward) {
        parcelCountQuery.where("cadastral.wardNo = :wardNo", { wardNo: ward });
      }

      const parcelCountByZone = await parcelCountQuery.getRawMany();

      // 2. Total Parcel Area by Different Zones
      const parcelAreaQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("SUM(cadastral.shapeArea)", "totalArea")
        .groupBy("cadastral.zone");

      if (ward) {
        parcelAreaQuery.where("cadastral.wardNo = :wardNo", { wardNo: ward });
      }

      const totalParcelAreaByZone = await parcelAreaQuery.getRawMany();

      // 3. Distribution of Parcel Sizes (Small, Medium, Big)
      const parcelSizeDistribution = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select([
          "SUM(CASE WHEN cadastral.shapeArea <= 100 THEN 1 ELSE 0 END) AS smallParcels",
          "SUM(CASE WHEN cadastral.shapeArea > 100 AND cadastral.shapeArea <= 500 THEN 1 ELSE 0 END) AS mediumParcels",
          "SUM(CASE WHEN cadastral.shapeArea > 500 THEN 1 ELSE 0 END) AS largeParcels",
        ])
        .getRawOne();

      // 4. Average Parcel Sizes by Zone
      const avgParcelSizeQuery = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("AVG(cadastral.shapeArea)", "avgParcelSize")
        .groupBy("cadastral.zone");

      if (ward) {
        avgParcelSizeQuery.where("cadastral.wardNo = :wardNo", {
          wardNo: ward,
        });
      }

      const avgParcelSizesByZone = await avgParcelSizeQuery.getRawMany();

      // 5. Largest vs Smallest Parcel
      const largestParcelQuery: any = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("MAX(cadastral.shapeArea)", "largestParcel")
        .getRawOne();
      const smallestParcelQuery: any = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("MIN(cadastral.shapeArea)", "smallestParcel")
        .getRawOne();

      // Format the response
      res.json({
        status: 200,
        success: true,
        message: "Zone stats retrieved successfully",
        data: [
          {
            data: parcelCountByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                totalParcels: Number(stat.totalParcels),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Total Parcels",
            chartName: "Total Parcel Count by Zones",
            chartTitle: "Parcel Count per Zone",
          },
          {
            data: totalParcelAreaByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                area: Number(stat.totalArea.toFixed(0)),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Area (Sq. meter)",
            chartName: "Total Parcel Area by Zones",
            chartTitle: "Parcel Area per Zone",
          },
          {
            data: [
              {
                size: "Small",
                count: Number(parcelSizeDistribution.smallparcels),
              },
              {
                size: "Medium",
                count: Number(parcelSizeDistribution.mediumparcels),
              },
              {
                size: "Large",
                count: Number(parcelSizeDistribution.largeparcels),
              },
            ],
            xAxisTitle: "Parcel Size",
            yAxisTitle: "Count",
            chartName: "Distribution of Parcel Sizes",
            chartTitle: "Parcel Size Distribution",
          },
          {
            data: avgParcelSizesByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                avgParcelSize: Number(stat.avgParcelSize.toFixed(0)),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Average Parcel Size (Sq. meters)",
            chartName: "Average Parcel Size by Zones",
            chartTitle: "Average Parcel Size per Zone",
          },
          {
            data: [
              {
                type: "Largest Parcel",
                size: Number(largestParcelQuery.largestParcel.toFixed(0)),
              },
              {
                type: "Smallest Parcel",
                size: Number(smallestParcelQuery.smallestParcel.toFixed(0)),
              },
            ],
            xAxisTitle: "Parcel Type",
            yAxisTitle: "Area (Sq. meters)",
            chartName: "Largest vs Smallest Parcel",
            chartTitle: "Largest Vs Smallest parcel Size",
          },
        ]
          // Filter out empty data arrays
          .filter((section) => section.data.length > 0),
      });
    } catch (error) {
      console.error("Error fetching zone stats:", error);
      next(error);
    }
  }

  async getStatsTaxProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const wardNo = req.query.ward as string | undefined;

      const valuationDistributionQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select([
          "COALESCE(COUNT(CASE WHEN cadastral.valuation >= 0 AND cadastral.valuation <= 1000000 THEN 1 END), 0) AS upto10Lakh",
          "COALESCE(COUNT(CASE WHEN cadastral.valuation > 1000000 AND cadastral.valuation <= 5000000 THEN 1 END), 0) AS from10to50Lakh",
          "COALESCE(COUNT(CASE WHEN cadastral.valuation > 5000000 AND cadastral.valuation <= 10000000 THEN 1 END), 0) AS from50LakhTo1Crore",
          "COALESCE(COUNT(CASE WHEN cadastral.valuation > 10000000 AND cadastral.valuation <= 20000000 THEN 1 END), 0) AS from1To2Crore",
          "COALESCE(COUNT(CASE WHEN cadastral.valuation > 20000000 AND cadastral.valuation <= 40000000 THEN 1 END), 0) AS from2To4Crore",
          "COALESCE(COUNT(CASE WHEN cadastral.valuation > 40000000 THEN 1 END), 0) AS above5Crore",
        ]);

      if (wardNo) {
        valuationDistributionQuery.where("cadastral.wardNo = :wardNo", {
          wardNo,
        });
      }

      valuationDistributionQuery.andWhere("cadastral.valuation IS NOT NULL");

      const valuationDistribution =
        await valuationDistributionQuery.getRawOne();

      // 7. Area Composition by Valuation
      const areaCompositionQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select([
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation >= 0 AND cadastral.valuation <= 1000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaUpto10Lakh",
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation > 1000000 AND cadastral.valuation <= 5000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaFrom10to50Lakh",
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation > 5000000 AND cadastral.valuation <= 10000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaFrom50LakhTo1Crore",
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation > 10000000 AND cadastral.valuation <= 20000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaFrom1To2Crore",
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation > 20000000 AND cadastral.valuation <= 40000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaFrom2To4Crore",
          "COALESCE(ROUND(CAST(SUM(CASE WHEN cadastral.valuation > 40000000 THEN cadastral.shapeArea ELSE 0 END) / 338.0 AS numeric), 2), 0) AS areaAbove5Crore",
        ]);

      if (wardNo) {
        areaCompositionQuery.where("cadastral.wardNo = :wardNo", { wardNo });
      }

      areaCompositionQuery
        .andWhere("cadastral.valuation IS NOT NULL")
        .andWhere("cadastral.shapeArea IS NOT NULL");

      const areaComposition = await areaCompositionQuery.getRawOne();

      // 1. Total Parcel Count by Zones
      const parcelCountQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("COUNT(cadastral.parcelNo)", "totalParcels")
        .groupBy("cadastral.zone");

      if (wardNo) {
        parcelCountQuery.where("cadastral.wardNo = :wardNo", { wardNo });
      }

      const parcelCountByZone = await parcelCountQuery.getRawMany();

      // 2. Total Parcel Area by Different Zones
      const parcelAreaQuery = this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("SUM(cadastral.shapeArea)", "totalArea")
        .groupBy("cadastral.zone");

      if (wardNo) {
        parcelAreaQuery.where("cadastral.wardNo = :wardNo", { wardNo });
      }

      const totalParcelAreaByZone = await parcelAreaQuery.getRawMany();

      // 3. Distribution of Parcel Sizes (Small, Medium, Big)
      const parcelSizeDistribution = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select([
          "SUM(CASE WHEN cadastral.shapeArea <= 100 THEN 1 ELSE 0 END) AS smallParcels",
          "SUM(CASE WHEN cadastral.shapeArea > 100 AND cadastral.shapeArea <= 500 THEN 1 ELSE 0 END) AS mediumParcels",
          "SUM(CASE WHEN cadastral.shapeArea > 500 THEN 1 ELSE 0 END) AS largeParcels",
        ])
        .getRawOne();

      // 4. Average Parcel Sizes by Zone
      const avgParcelSizeQuery = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("cadastral.zone", "landZone")
        .addSelect("AVG(cadastral.shapeArea)", "avgParcelSize")
        .groupBy("cadastral.zone");

      if (wardNo) {
        avgParcelSizeQuery.where("cadastral.wardNo = :wardNo", { wardNo });
      }

      const avgParcelSizesByZone = await avgParcelSizeQuery.getRawMany();

      // 5. Largest vs Smallest Parcel
      const largestParcelQuery: any = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("MAX(cadastral.shapeArea)", "largestParcel")
        .getRawOne();
      const smallestParcelQuery: any = await this.landCadastralRepo
        .createQueryBuilder("cadastral")
        .select("MIN(cadastral.shapeArea)", "smallestParcel")
        .getRawOne();
      // Format the response
      res.json({
        status: 200,
        success: true,
        message: "Zone stats retrieved successfully",
        data: [
          {
            data: [
              {
                range: "0 to 10 Lakh",
                count: parseInt(valuationDistribution.upto10lakh) || 0,
              },
              {
                range: "10 to 50 Lakh",
                count: parseInt(valuationDistribution.from10to50lakh) || 0,
              },
              {
                range: "50 Lakh to 1 Crore",
                count: parseInt(valuationDistribution.from50lakhto1crore) || 0,
              },
              {
                range: "1 to 2 Crore",
                count: parseInt(valuationDistribution.from1to2crore) || 0,
              },
              {
                range: "2 to 4 Crore",
                count: parseInt(valuationDistribution.from2to4crore) || 0,
              },
              {
                range: "Above 5 Crore",
                count: parseInt(valuationDistribution.above5crore) || 0,
              },
            ],
            xAxisTitle: "Valuation Range",
            yAxisTitle: "Count",
            chartName: "Total Parcels by Valuation Range",
            chartTitle: "Parcel Count by Valuation Category",
          },
          {
            data: [
              {
                range: "0 to 10 Lakh",
                area: parseFloat(areaComposition.areaupto10lakh) || 0,
              },
              {
                range: "10 to 50 Lakh",
                area: parseFloat(areaComposition.areafrom10to50lakh) || 0,
              },
              {
                range: "50 Lakh to 1 Crore",
                area: parseFloat(areaComposition.areafrom50lakhto1crore) || 0,
              },
              {
                range: "1 to 2 Crore",
                area: parseFloat(areaComposition.areafrom1to2crore) || 0,
              },
              {
                range: "2 to 4 Crore",
                area: parseFloat(areaComposition.areafrom2to4crore) || 0,
              },
              {
                range: "Above 5 Crore",
                area: parseFloat(areaComposition.areaabove5crore) || 0,
              },
            ],
            xAxisTitle: "Valuation Range",
            yAxisTitle: "Area (Katha)",
            chartName: "Area Composition by Valuation Range",
            chartTitle: "Area by Valuation Category (in Katha)",
          },
          {
            data: parcelCountByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                totalParcels: Number(stat.totalParcels),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Total Parcels",
            chartName: "Total Parcel Count by Zones",
            chartTitle: "Parcel Count per Zone",
          },
          {
            data: totalParcelAreaByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                area: Number(stat.totalArea.toFixed(0)),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Area (Sq. meter)",
            chartName: "Total Parcel Area by Zones",
            chartTitle: "Parcel Area per Zone",
          },
          {
            data: [
              {
                size: "Small",
                count: Number(parcelSizeDistribution.smallparcels),
              },
              {
                size: "Medium",
                count: Number(parcelSizeDistribution.mediumparcels),
              },
              {
                size: "Large",
                count: Number(parcelSizeDistribution.largeparcels),
              },
            ],
            xAxisTitle: "Parcel Size",
            yAxisTitle: "Count",
            chartName: "Distribution of Parcel Sizes",
            chartTitle: "Parcel Size Distribution",
          },
          {
            data: avgParcelSizesByZone
              .filter(
                (stat: any) => stat.landZone && stat.landZone !== "N/A" // Exclude null, undefined, and "N/A"
              )
              .map((stat: any) => ({
                landzone: stat.landZone || "Unknown",
                avgParcelSize: Number(stat.avgParcelSize.toFixed(0)),
              })),
            xAxisTitle: "LandZones",
            yAxisTitle: "Average Parcel Size (Sq. meters)",
            chartName: "Average Parcel Size by Zones",
            chartTitle: "Average Parcel Size per Zone",
          },
          {
            data: [
              {
                type: "Largest Parcel",
                size: Number(largestParcelQuery.largestParcel.toFixed(0)),
              },
              {
                type: "Smallest Parcel",
                size: Number(smallestParcelQuery.smallestParcel.toFixed(0)),
              },
            ],
            xAxisTitle: "Parcel Type",
            yAxisTitle: "Area (Sq. meters)",
            chartName: "Largest vs Smallest Parcel",
            chartTitle: "Largest Vs Smallest parcel Size",
          },
        ].filter((section) => section.data.length > 0),
      });
    } catch (error) {
      console.error("Error fetching zone stats:", error);
      next(error);
    }
  }

  // Backend: getTiles function
  async getTiles(req: Request, res: Response) {
    const { z, x, y } = req.params;

    const maxTile = Math.pow(2, parseInt(z, 10)) - 1;

    if (
      Number(x) < 0 ||
      Number(x) > maxTile ||
      Number(y) < 0 ||
      Number(y) > maxTile
    ) {
      return res.status(400).send("Invalid tile coordinates");
    }

    const query = `
    WITH bounds AS (
      SELECT ST_Transform(ST_TileEnvelope(${z}, ${x}, ${y}), 4326) AS geom
    )
    SELECT ST_AsMVT(tile, 'cadastral', 4096, 'geom') 
    FROM (
      SELECT ST_AsMVTGeom(
        ST_Transform(wkb_geometry, 3857), 
        (SELECT ST_Transform(geom, 3857) FROM bounds), 
        4096, 
        256,
        true
      ) AS geom,
      ogc_fid, parcel_no, ward_no, shape_area
      FROM public.cadastral
      WHERE ST_Intersects(
        wkb_geometry, 
        ST_Transform((SELECT geom FROM bounds), 4326)
      )
    ) AS tile;
  `;

    try {
      const entityManager = AppDataSource.manager;
      const result = await entityManager.query(query);

      if (result && result.length > 0 && result[0].st_asmvt) {
        res.setHeader("Content-Type", "application/x-protobuf");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "public, max-age=3600"); // Add caching
        res.send(result[0].st_asmvt);
      } else {
        res.status(404).send("Tile not found");
      }
    } catch (error) {
      console.error("Error fetching tiles:", error);
      res.status(500).send("Internal Server Error");
    }
  }
}

export default new LandCadastral();
