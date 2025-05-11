import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_currentlivingstatus_pkey", ["id"], { unique: true })
@Entity("digital_profile_currentlivingstatus", { schema: "public" })
export class DigitalProfileCurrentlivingstatus {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "living_status",
    nullable: true,
    length: 50,
  })
  livingStatus: string | null;

  @Column("character varying", {
    name: "country_name_if_foreign",
    nullable: true,
    length: 50,
  })
  countryNameIfForeign: string | null;

  @Column("character varying", {
    name: "reason_to_live_in_foreign",
    nullable: true,
    length: 50,
  })
  reasonToLiveInForeign: string | null;

  @Column("character varying", { name: "province", nullable: true, length: 50 })
  province: string | null;

  @Column("character varying", { name: "district", nullable: true, length: 50 })
  district: string | null;

  @Column("character varying", { name: "palika", nullable: true, length: 50 })
  palika: string | null;

  @Column("integer", {
    name: "ward_no_live_in_other_place_within_country",
    nullable: true,
  })
  wardNoLiveInOtherPlaceWithinCountry: number | null;

  @Column("character varying", {
    name: "reason_to_live_in_other_place_within_country",
    nullable: true,
    length: 50,
  })
  reasonToLiveInOtherPlaceWithinCountry: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileCurrentlivingstatuses
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
