import { Repository } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { Ward } from "../../entities/basic/Ward";
import { AppDataSource } from "../../config/database";
async function getLandMarksByWard(
  entityRepo: Repository<any>, // This will accept any entity repository (e.g., Hospital, School)
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  const { ward } = req.query; // Get ward from query params

  try {
    let entityQuery = entityRepo.createQueryBuilder("entity");

    if (ward) {
      // Find the boundary (geometry) of the ward
      const wardBoundary = await AppDataSource.getRepository(Ward)
        .createQueryBuilder("ward")
        .where("ward.ward = :ward", { ward })
        .getOne();

      if (!wardBoundary) {
        return res.status(404).json({ message: `Ward ${ward} not found` });
      }

      // Use the ward boundary to filter entities that intersect with it
      // Ensure ward geometry is in WKT format for ST_GeomFromText
      entityQuery = entityQuery
        .where(
          "ST_Intersects(entity.wkb_geometry, ST_SetSRID(ST_GeomFromGeoJSON(:wardGeometry), 4326))"
        )
        .setParameter("wardGeometry", wardBoundary.geometry);
    }

    // Fetch the entity data
    const entities = await entityQuery
      .select([
        "entity.ogc_fid AS id",
        "entity.name AS name",
        "ST_AsGeoJSON(entity.wkb_geometry) AS geometry",
      ])
      .getRawMany();

    // Format the result into GeoJSON structure
    const geojson = {
      type: "FeatureCollection",
      features: entities.map((entity) => ({
        type: "Feature",
        properties: {
          name: entity.name,
        },
        geometry: JSON.parse(entity.geometry),
      })),
    };

    return res.status(200).json({
      success: true,
      data: geojson,
      message: `${entityRepo.target} Geojson Data Retrieved Successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

export default getLandMarksByWard;
