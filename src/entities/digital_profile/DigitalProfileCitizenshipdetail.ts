import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_citizenshipdetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_citizenshipdetail", { schema: "public" })
export class DigitalProfileCitizenshipdetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character", { name: "has_citizenship", nullable: true, length: 1 })
  hasCitizenship: string | null;

  @Column("character varying", {
    name: "reason_not_have_citizenship",
    nullable: true,
    length: 80,
  })
  reasonNotHaveCitizenship: string | null;

  @Column("character varying", {
    name: "citizenship_no",
    nullable: true,
    length: 50,
  })
  citizenshipNo: string | null;

  @Column("character varying", {
    name: "date_issued",
    nullable: true,
    length: 100,
  })
  dateIssued: string | null;

  @Column("character varying", {
    name: "district_of_issue",
    nullable: true,
    length: 100,
  })
  districtOfIssue: string | null;

  @Column("character varying", {
    name: "image_of_citizenship_front",
    nullable: true,
    length: 100,
  })
  imageOfCitizenshipFront: string | null;

  @Column("text", { name: "citizenship_image_front_url", nullable: true })
  citizenshipImageFrontUrl: string | null;

  @Column("text", { name: "image_of_citizenship_back", nullable: true })
  imageOfCitizenshipBack: string | null;

  @Column("text", { name: "citizenship_image_back_url", nullable: true })
  citizenshipImageBackUrl: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileCitizenshipdetails
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
