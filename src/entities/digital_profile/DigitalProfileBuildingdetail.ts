import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_buildingdetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_buildingdetail", { schema: "public" })
export class DigitalProfileBuildingdetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "house_image",
    nullable: true,
    length: 100,
  })
  houseImage: string | null;

  @Column("text", { name: "house_image_url", nullable: true })
  houseImageUrl: string | null;

  @Column("character varying", {
    name: "land_type",
    nullable: true,
    length: 100,
  })
  landType: string | null;

  @Column("character varying", {
    name: "type_of_house",
    nullable: true,
    length: 100,
  })
  typeOfHouse: string | null;

  @Column("numeric", { name: "house_storeys", nullable: true })
  houseStoreys: string | null;

  @Column("real", { name: "house_area", nullable: true })
  houseArea: number | null;

  @Column("character varying", {
    name: "house_made_date",
    nullable: true,
    length: 100,
  })
  houseMadeDate: string | null;

  @Column("character", {
    name: "has_house_map_passed",
    nullable: true,
    length: 1,
  })
  hasHouseMapPassed: string | null;

  @Column("character", {
    name: "has_all_requirements_fulfilled",
    nullable: true,
    length: 1,
  })
  hasAllRequirementsFulfilled: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileBuildingdetails
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
