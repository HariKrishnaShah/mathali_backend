import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_nationalidentity_pkey", ["id"], { unique: true })
@Entity("digital_profile_nationalidentity", { schema: "public" })
export class DigitalProfileNationalidentity {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_national_registration_card", nullable: true })
  hasNationalRegistrationCard: boolean | null;

  @Column("character varying", {
    name: "national_registration_card_no",
    nullable: true,
    length: 100,
  })
  nationalRegistrationCardNo: string | null;

  @Column("character varying", {
    name: "issued_date",
    nullable: true,
    length: 100,
  })
  issuedDate: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileNationalidentities
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
