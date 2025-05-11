import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_agriculturevegetable_pkey", ["id"], { unique: true })
@Entity("digital_profile_agriculturevegetable", { schema: "public" })
export class DigitalProfileAgriculturevegetable {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "veg_production",
    nullable: true,
    length: 50,
  })
  vegProduction: string | null;

  @Column("character varying", {
    name: "veg_production_area",
    nullable: true,
    length: 50,
  })
  vegProductionArea: string | null;

  @Column("real", { name: "sales_result", nullable: true })
  salesResult: number | null;

  @Column("character varying", { name: "ward_no", nullable: true, length: 50 })
  wardNo: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) =>
      digitalProfileHouse.digitalProfileAgriculturevegetables
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
