import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_disabilitystatus_pkey", ["id"], { unique: true })
@Entity("digital_profile_disabilitystatus", { schema: "public" })
export class DigitalProfileDisabilitystatus {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_disability", nullable: true })
  hasDisability: boolean | null;

  @Column("character varying", {
    name: "status_of_disability",
    nullable: true,
    length: 50,
  })
  statusOfDisability: string | null;

  @Column("boolean", { name: "has_disability_card", nullable: true })
  hasDisabilityCard: boolean | null;

  @Column("character varying", {
    name: "type_of_disability_card",
    nullable: true,
    length: 50,
  })
  typeOfDisabilityCard: string | null;

  @Column("character varying", {
    name: "disability_card_no",
    nullable: true,
    length: 50,
  })
  disabilityCardNo: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileDisabilitystatuses
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
