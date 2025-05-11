import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../basic/Base";

@Entity("water_bodies", { schema: "public" })
export class WaterBodies {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  // GiST spatial index on the geometry column

  @Column("geometry", {
    name: "wkb_geometry",
    nullable: true,
  })
  wkbGeometry: string | null;

  @Column("double precision", {
    name: "shape_area",
    nullable: true,
  })
  shapeArea: number | null;

  @Column("character varying", { name: "zone", nullable: true })
  zone: string | null;
}
