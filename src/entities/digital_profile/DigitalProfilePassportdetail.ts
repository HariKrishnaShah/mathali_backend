import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_passportdetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_passportdetail", { schema: "public" })
export class DigitalProfilePassportdetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_passport", nullable: true })
  hasPassport: boolean | null;

  @Column("character varying", {
    name: "passport_no",
    nullable: true,
    length: 100,
  })
  passportNo: string | null;

  @Column("character varying", {
    name: "place_of_issue",
    nullable: true,
    length: 100,
  })
  placeOfIssue: string | null;

  @Column("date", { name: "date_of_issue", nullable: true })
  dateOfIssue: string | null;

  @Column("date", { name: "expiry_date", nullable: true })
  expiryDate: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfilePassportdetails
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
