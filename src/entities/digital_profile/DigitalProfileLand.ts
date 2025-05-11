import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_land_pkey", ["id"], { unique: true })
@Entity("digital_profile_land", { schema: "public" })
export class DigitalProfileLand {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("text", { name: "land_record_image", nullable: true })
  landRecordImage: string | null;

  @Column("text", { name: "land_record_image_url", nullable: true })
  landRecordImageUrl: string | null;

  @Column("character varying", {
    name: "kitta_no",
    nullable: true,
    length: 100,
  })
  kittaNo: string | null;

  @Column("character varying", { name: "palika", nullable: true, length: 100 })
  palika: string | null;

  @Column("integer", { name: "current_ward_no", nullable: true })
  currentWardNo: number | null;

  @Column("character varying", { name: "area", nullable: true, length: 100 })
  area: string | null;

  @Column("character varying", { name: "use_for", nullable: true, length: 100 })
  useFor: string | null;

  @Column("character varying", {
    name: "road_type",
    nullable: true,
    length: 100,
  })
  roadType: string | null;

  @Column("character varying", {
    name: "owner_name",
    nullable: true,
    length: 100,
  })
  ownerName: string | null;

  @Column("boolean", { name: "is_self_used", nullable: true })
  isSelfUsed: boolean | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileLands
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
