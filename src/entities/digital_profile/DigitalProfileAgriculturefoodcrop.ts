import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_agriculturefoodcrop_pkey", ["id"], { unique: true })
@Entity("digital_profile_agriculturefoodcrop", { schema: "public" })
export class DigitalProfileAgriculturefoodcrop {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "food_production",
    nullable: true,
    length: 50,
  })
  foodProduction: string | null;

  @Column("character varying", {
    name: "food_production_area",
    nullable: true,
    length: 50,
  })
  foodProductionArea: string | null;

  @Column("real", { name: "sales_result", nullable: true })
  salesResult: number | null;

  @Column("character varying", { name: "ward_no", nullable: true, length: 50 })
  wardNo: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) =>
      digitalProfileHouse.digitalProfileAgriculturefoodcrops
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
