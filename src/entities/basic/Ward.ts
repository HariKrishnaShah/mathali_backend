import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "./Base";

@Entity("ward", { schema: "public" })
export class Ward {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "geometry", nullable: true })
  geometry: string;

  @Column("numeric", { name: "ward", nullable: true, precision: 10, scale: 0 })
  ward: number;

  @Column("double precision", {
    name: "area_sqkm",
    nullable: true,
  })
  areaSqkm: number | null;

  @Column("double precision", {
    name: "shape_area",
    nullable: true,
  })
  shapeArea: number | null;
}
