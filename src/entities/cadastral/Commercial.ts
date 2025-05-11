import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../basic/Base";

// @Index("commercial_pk", ["ogcFid"], { unique: true })
@Index("commercial_wkb_geometry_geom_idx", { synchronize: false })
@Entity("commercial", { schema: "public" })
export class Commercial {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("double precision", {
    name: "shape_area",
    nullable: true,
  })
  shapeArea: number | null;

  @Column("character varying", { name: "zone", nullable: true })
  zone: string | null;
}
