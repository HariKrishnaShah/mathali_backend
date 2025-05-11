import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_drinkingwatersurvey_pkey", ["id"], { unique: true })
@Entity("digital_profile_drinkingwatersurvey", { schema: "public" })
export class DigitalProfileDrinkingwatersurvey {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("integer", { name: "ward_no", nullable: true })
  wardNo: number | null;

  @Column("character varying", {
    name: "main_source",
    nullable: true,
    length: 255,
  })
  mainSource: string | null;

  @Column("character varying", {
    name: "other_main_source",
    nullable: true,
    length: 255,
  })
  otherMainSource: string | null;

  @Column("boolean", { name: "purification_done", nullable: true })
  purificationDone: boolean | null;

  @Column("character varying", {
    name: "purification_method",
    nullable: true,
    length: 255,
  })
  purificationMethod: string | null;

  @Column("character varying", {
    name: "other_purification_method",
    nullable: true,
    length: 255,
  })
  otherPurificationMethod: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) =>
      digitalProfileHouse.digitalProfileDrinkingwatersurveys
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
