import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseEntity } from "../basic/Base";
import { CadastralUpdateRequest } from "./CadastralUpdateRequest";
import { Sifarish } from "./Sifarish";
import { ValuationSifarish } from "./ValuationSifarish";

// @Index("cadastral_pk", ["ogcFid"], { unique: true })
@Index("cadastral_wkb_geometry_geom_idx", { synchronize: false })
@Entity("cadastral", { schema: "public" })
export class Cadastral {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string;

  @Column("numeric", {
    name: "parcel_no",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  parcelNo: number;

  @Column("character varying", { name: "ward_no", nullable: true })
  wardNo: string | null;

  @Column("double precision", {
    name: "shape_area",
    nullable: true,
  })
  shapeArea: number | null;

  @Column("character varying", { name: "sheet_no", nullable: true })
  sheetNo: string | null;

  @Column("character varying", { name: "zone", nullable: true })
  zone: string | null;

  @Column("character varying", { name: "zone_nepali", nullable: true })
  zoneNepali: string | null;

  @Column("character varying", { name: "former_vdc", nullable: true })
  formerVdc: string | null;

  @Column("character varying", { name: "remarks", nullable: true })
  remarks: string | null;

  @Column({ name: "valuation", nullable: true, type: "real" })
  valuation: number | null;
  @OneToMany(
    () => CadastralUpdateRequest,
    (cadastralUpdateRequest) => cadastralUpdateRequest.user
  ) // Establish relationship with Response
  cadastralUpdateRequests: CadastralUpdateRequest[];

  @OneToMany(() => Sifarish, (sifarish) => sifarish.cadastral, {
    cascade: true,
  })
  sifarish: Sifarish[];

  @OneToMany(() => ValuationSifarish, (sifarish) => sifarish.cadastral, {
    cascade: true,
  })
  valuationSifarish: Sifarish[];
}
