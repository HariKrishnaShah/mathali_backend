import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

// @Index("agriculture_pk", ["ogcFid"], { unique: true })
@Index("agriculture_wkb_geometry_geom_idx", { synchronize: false })
@Entity("agriculture", { schema: "public" })
export class Agriculture {
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
