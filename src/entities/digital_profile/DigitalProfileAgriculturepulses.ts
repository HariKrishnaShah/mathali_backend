import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_agriculturepulses_pkey", ["id"], { unique: true })
@Entity("digital_profile_agriculturepulses", { schema: "public" })
export class DigitalProfileAgriculturepulses {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "pulse_production",
    nullable: true,
    length: 50,
  })
  pulseProduction: string | null;

  @Column("character varying", {
    name: "pulse_production_area",
    nullable: true,
    length: 50,
  })
  pulseProductionArea: string | null;

  @Column("real", { name: "sales_result", nullable: true })
  salesResult: number | null;

  @Column("character varying", { name: "ward_no", nullable: true, length: 50 })
  wardNo: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileAgriculturepulses
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
