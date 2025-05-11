import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_cookingfuel_pkey", ["id"], { unique: true })
@Entity("digital_profile_cookingfuel", { schema: "public" })
export class DigitalProfileCookingfuel {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("character varying", {
    name: "main_fuel",
    nullable: true,
    length: 255,
  })
  mainFuel: string | null;

  @Column("character varying", {
    name: "other_fuel",
    nullable: true,
    length: 255,
  })
  otherFuel: string | null;

  @Column("character varying", {
    name: "stove_type",
    nullable: true,
    length: 255,
  })
  stoveType: string | null;

  @Column("character varying", {
    name: "other_stove_type",
    nullable: true,
    length: 255,
  })
  otherStoveType: string | null;

  @Column("text", { name: "has_ventilation", nullable: true })
  hasVentilation: string | null;

  @Column("character varying", {
    name: "ventilation_type",
    nullable: true,
    length: 255,
  })
  ventilationType: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileCookingfuels
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
