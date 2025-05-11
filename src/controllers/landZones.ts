import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Agriculture } from "../entities/cadastral/Agriculture";
import { Commercial } from "../entities/cadastral/Commercial";
import { Forest } from "../entities/cadastral/Forest";
import { Industrial } from "../entities/cadastral/Industrial";
import { PublicUse } from "../entities/cadastral/PublicUse";
import { Residential } from "../entities/cadastral/Residential";
import { Ward } from "../entities/basic/Ward";
import { WaterBodies } from "../entities/cadastral/WaterBodies";
import { GeoJSON } from "typeorm";
class LandZones {
  constructor(
    private wardRepo = AppDataSource.getRepository(Ward),
    private agricultureRepo = AppDataSource.getRepository(Agriculture),
    private commercialRepo = AppDataSource.getRepository(Commercial),
    private forestRepo = AppDataSource.getRepository(Forest),
    private industrialRepo = AppDataSource.getRepository(Industrial),
    private publicUseRepo = AppDataSource.getRepository(PublicUse),
    private residentialRepo = AppDataSource.getRepository(Residential),
    private waterBodiesRepo = AppDataSource.getRepository(WaterBodies)
  ) {}
  // Helper to format into GeoJSON
  private formatToGeoJSON(entities: any[]): GeoJSON {
    return {
      type: "FeatureCollection",
      features: entities.map((entity) => ({
        type: "Feature",
        geometry: entity.wkbGeometry, // assuming the geometries are valid GeoJSON
        properties: {
          id: entity.ogcFid,
          zone: entity.zone,
          shapeArea: entity.shapeArea,
        },
      })),
    };
  }

  // General function to fetch data based on ward and entity repository
  private async fetchLandZoneData(
    repo: any,
    req: Request,
    res: Response
  ): Promise<any> {
    const { ward } = req.query;

    let query = repo.createQueryBuilder("zone");

    if (ward) {
      // Fetch the ward geometry for spatial filtering
      const wardEntity = await this.wardRepo
        .createQueryBuilder("ward")
        .where("ward.ward = :ward", { ward })
        .getOne();

      if (!wardEntity) {
        return res.status(404).json({ message: "Ward not found" });
      }

      query = query
        .where(
          `ST_Intersects(zone.wkb_geometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))`
        )
        .setParameter("wardGeometry", wardEntity.geometry);
    }

    const data = await query.getMany();
    const geoJSON = this.formatToGeoJSON(data);

    res.json({
      status: 200,
      success: true,
      message: "Geojson data retreived sucessfully",
      data: geoJSON,
    });
  }

  // Each land zone function
  async getAgriculture(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.agricultureRepo, req, res);
  }
  async getCommercial(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.commercialRepo, req, res);
  }

  async getForest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.forestRepo, req, res);
  }

  async getIndustrial(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.industrialRepo, req, res);
  }
  async getPublicUse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.publicUseRepo, req, res);
  }

  async getResidential(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.residentialRepo, req, res);
  }

  async getWaterBodies(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.fetchLandZoneData(this.waterBodiesRepo, req, res);
  }
}
export default new LandZones();
