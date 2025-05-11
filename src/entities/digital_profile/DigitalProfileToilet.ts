import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_toilet_pkey", ["id"], { unique: true })
@Entity("digital_profile_toilet", { schema: "public" })
export class DigitalProfileToilet {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("character varying", {
    name: "toilet_type",
    nullable: true,
    length: 100,
  })
  toiletType: string | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileToilets
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
