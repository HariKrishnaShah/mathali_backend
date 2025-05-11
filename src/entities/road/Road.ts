import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseEntity } from "../basic/Base";
import { RoadCordinate } from "./RoadCordinate";

// @Index("road_pk", ["ogcFid"], { unique: true })
@Index("road_wkb_geometry_geom_idx", { synchronize: false })
@Entity("road", { schema: "public" })
export class Road {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("numeric", { name: "id", nullable: true, precision: 10, scale: 0 })
  id: string | null;

  @Column("character varying", { name: "road_class", nullable: true })
  roadClass: string | null;

  @Column({ type: "double precision", nullable: true })
  width: number;

  @Column("character varying", { name: "name_english", nullable: true })
  nameEnglish: string | null;

  @Column("character varying", { name: "name_nepali", nullable: true })
  nameNepali: string | null;

  @Column("character varying", { name: "pavement_type", nullable: true })
  pavementType: string | null;

  @Column("character varying", { name: "drain_type", nullable: true })
  drainType: string | null;

  @Column("character varying", { name: "wards_touched", nullable: true })
  wardsTouched: string | null;

  @Column("double precision", { name: "length", nullable: true })
  length: number | null;

  @Column("character varying", { name: "class", nullable: true })
  class: string | null;

  @Column("numeric", {
    name: "reserve",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  reserve: string | null;

  @Column("double precision", {
    name: "width_feet",
    nullable: true,
  })
  widthFeet: number | null;

  @Column("character varying", { name: "ward_touch", nullable: true })
  wardTouch: string | null;

  @Column("numeric", {
    name: "houses_touched",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  housesTouched: string | null;

  @Column("double precision", {
    name: "scoring_h",
    nullable: true,
  })
  scoringH: number | null;

  @Column("numeric", {
    name: "priority_i",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  priorityI: string | null;

  @Column("numeric", {
    name: "scoring__p",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  scoringP: string | null;

  @Column("numeric", {
    name: "priority_1",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  priority_1: string | null;

  @Column("double precision", {
    name: "scoring_w",
    nullable: true,
  })
  scoringW: number | null;

  @Column("numeric", {
    name: "priority_2",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  priority_2: string | null;

  @Column("double precision", {
    name: "weighted_a",
    nullable: true,
  })
  weightedA: number | null;

  @Column("numeric", {
    name: "wighted_pr",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  wightedPr: string | null;

  @Column("numeric", {
    name: "width_grou",
    nullable: true,
    precision: 10,
    scale: 0,
  })
  widthGrou: string | null;

  @Column("double precision", { name: "row", nullable: true })
  row: number | null;

  @Column("double precision", {
    name: "row_ft_",
    nullable: true,
  })
  rowFt: number | null;

  @Column("double precision", {
    name: "row_calcul",
    nullable: true,
  })
  rowCalcul: number | null;
  @OneToMany(() => RoadCordinate, (roadCordinate) => roadCordinate.road)
  roadCordinates: RoadCordinate[];
}
