import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_school_pkey", ["id"], { unique: true })
@Entity("digital_profile_school", { schema: "public" })
export class DigitalProfileSchool {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "school_type",
    nullable: true,
    length: 100,
  })
  schoolType: string | null;

  @Column("character varying", {
    name: "ways_to_reach_school",
    nullable: true,
    length: 100,
  })
  waysToReachSchool: string | null;

  @Column("real", {
    name: "time_to_reach_school",
    nullable: true,
  })
  timeToReachSchool: number | null;

  @Column("integer", { name: "ward_no", nullable: true })
  wardNo: number | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileSchools
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
