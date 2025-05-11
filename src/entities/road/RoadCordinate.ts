import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Road } from "./Road";

@Entity("road_cordinate", { schema: "public" })
export class RoadCordinate {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @CreateDateColumn({
    name: "recorded_on",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  recordedOn: Date;

  @Column("character varying", { name: "pavement_type", nullable: true })
  pavementType: string | null;

  @Column("double precision", {
    name: "start_longitude",
    nullable: true,
  })
  startLongitude: number | null;

  @Column("double precision", {
    name: "start_latitude",
    nullable: true,
  })
  startLatitude: number | null;

  @Column("double precision", {
    name: "end_longitude",
    nullable: true,
  })
  endLongitude: number | null;

  @Column("double precision", {
    name: "end_latitude",
    nullable: true,
  })
  endLatitude: number | null;

  @ManyToOne(() => Road, (road) => road.roadCordinates, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "road_id", referencedColumnName: "ogcFid" }])
  road: Road;
}
