import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../basic/Base";

// @Index("house_pk", ["ogcFid"], { unique: true })
@Index("house_wkb_geometry_geom_idx", { synchronize: false })
@Entity("house", { schema: "public" })
export class House {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("double precision", {
    name: "latitude",
    nullable: true,
  })
  latitude: number | null;

  @Column("double precision", {
    name: "longitude",
    nullable: true,
  })
  longitude: number | null;

  @Column("double precision", {
    name: "house_id",
    nullable: true,
  })
  houseId: number | null;

  @Column("character varying", { name: "owner", nullable: true })
  owner: string | null;

  @Column("character varying", { name: "tole", nullable: true })
  tole: string | null;

  @Column("character varying", { name: "road_code", nullable: true })
  roadCode: string | null;

  @Column("character varying", { name: "block", nullable: true })
  block: string | null;

  @Column("double precision", {
    name: "x_starting",
    nullable: true,
  })
  xStarting: number | null;

  @Column("double precision", {
    name: "y_starting",
    nullable: true,
  })
  yStarting: number | null;

  @Column("double precision", {
    name: "distance_f",
    nullable: true,
  })
  distanceF: number | null;

  @Column("numeric", {
    name: "rank_from",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  rankFrom: string | null;

  @Column("character varying", { name: "house_code", nullable: true })
  houseCode: string | null;

  @Column("character varying", { name: "google_plu", nullable: true })
  googlePlu: string | null;

  @Column("character varying", { name: "name_english", nullable: true })
  nameEnglish: string | null;

  @Column("character varying", { name: "name_nepali", nullable: true })
  nameNepali: string | null;

  @Column("character varying", { name: "ward", nullable: true })
  ward: string | null;

  @Column("boolean", {
    name: "is_number_plate_installed",
    nullable: false,
    default: false,
  })
  isNumberPlateInstalled: boolean;
}
