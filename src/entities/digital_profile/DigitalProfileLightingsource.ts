import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_lightingsource_pkey", ["id"], { unique: true })
@Entity("digital_profile_lightingsource", { schema: "public" })
export class DigitalProfileLightingsource {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("character varying", {
    name: "main_source",
    nullable: true,
    length: 255,
  })
  mainSource: string | null;

  @Column("character varying", {
    name: "other_source",
    nullable: true,
    length: 255,
  })
  otherSource: string | null;

  @Column("boolean", { name: "has_meter", nullable: true })
  hasMeter: boolean | null;

  @Column("text", { name: "reason_not_using_electricity", nullable: true })
  reasonNotUsingElectricity: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileLightingsources
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
