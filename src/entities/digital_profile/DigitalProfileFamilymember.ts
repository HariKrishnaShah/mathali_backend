import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileCitizenshipdetail } from "./DigitalProfileCitizenshipdetail";
import { DigitalProfileCurrentlivingstatus } from "./DigitalProfileCurrentlivingstatus";
import { DigitalProfileDisabilitystatus } from "./DigitalProfileDisabilitystatus";
import { DigitalProfileEpidemicdetail } from "./DigitalProfileEpidemicdetail";
import { DigitalProfileHouse } from "./DigitalProfileHouse";
import { DigitalProfileHealthstatus } from "./DigitalProfileHealthstatus";
import { DigitalProfileNationalidentity } from "./DigitalProfileNationalidentity";
import { DigitalProfilePandetail } from "./DigitalProfilePandetail";
import { DigitalProfilePassportdetail } from "./DigitalProfilePassportdetail";
import { DigitalProfileSocialsecurity } from "./DigitalProfileSocialsecurity";
import { DigitalProfileVoterdetail } from "./DigitalProfileVoterdetail";
import { DigitalProfileEducation } from "./DigitalProfileEducation";

// @Index("digital_profile_familymember_pkey", ["personId"], { unique: true })
@Entity("digital_profile_familymember", { schema: "public" })
export class DigitalProfileFamilymember {
  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @PrimaryGeneratedColumn("increment", { name: "id" })
  personId: number;

  @Column("text", { name: "first_name", nullable: true })
  firstName: string | null;

  @Column("text", { name: "last_name", nullable: true })
  lastName: string | null;

  @Column("text", { name: "full_name_nepali", nullable: true })
  fullNameNepali: string | null;

  @Column("text", { name: "full_name_eng", nullable: true })
  fullNameEng: string | null;

  @Column("text", { name: "gender", nullable: true })
  gender: string | null;

  @Column("text", { name: "relation_with_family_head", nullable: true })
  relationWithFamilyHead: string | null;

  @Column("text", { name: "dob", nullable: true })
  dob: string | null;

  @Column("numeric", { name: "age", nullable: true })
  age: string | null;

  @Column("text", { name: "email", nullable: true })
  email: string | null;

  @Column("text", { name: "mobile_no", nullable: true })
  mobileNo: string | null;

  @Column("text", { name: "blood_group", nullable: true })
  bloodGroup: string | null;

  @Column("text", { name: "caste", nullable: true })
  caste: string | null;

  @Column("text", { name: "religion", nullable: true })
  religion: string | null;

  @Column("text", { name: "language", nullable: true })
  language: string | null;

  @Column("text", { name: "occupation", nullable: true })
  occupation: string | null;

  @Column("text", { name: "marital_status", nullable: true })
  maritalStatus: string | null;

  @Column("text", { name: "skill", nullable: true })
  skill: string | null;

  @Column("text", { name: "interest_areas", nullable: true })
  interestAreas: string | null;

  @OneToMany(
    () => DigitalProfileCitizenshipdetail,
    (digitalProfileCitizenshipdetail) => digitalProfileCitizenshipdetail.person
  )
  digitalProfileCitizenshipdetails: DigitalProfileCitizenshipdetail[];

  @OneToMany(
    () => DigitalProfileCurrentlivingstatus,
    (digitalProfileCurrentlivingstatus) =>
      digitalProfileCurrentlivingstatus.person
  )
  digitalProfileCurrentlivingstatuses: DigitalProfileCurrentlivingstatus[];

  @OneToMany(
    () => DigitalProfileDisabilitystatus,
    (digitalProfileDisabilitystatus) => digitalProfileDisabilitystatus.person
  )
  digitalProfileDisabilitystatuses: DigitalProfileDisabilitystatus[];

  @OneToMany(
    () => DigitalProfileEpidemicdetail,
    (digitalProfileEpidemicdetail) => digitalProfileEpidemicdetail.person
  )
  digitalProfileEpidemicdetails: DigitalProfileEpidemicdetail[];

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileFamilymembers
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;

  @OneToMany(
    () => DigitalProfileHealthstatus,
    (digitalProfileHealthstatus) => digitalProfileHealthstatus.person
  )
  digitalProfileHealthstatuses: DigitalProfileHealthstatus[];

  @OneToMany(
    () => DigitalProfileNationalidentity,
    (digitalProfileNationalidentity) => digitalProfileNationalidentity.person
  )
  digitalProfileNationalidentities: DigitalProfileNationalidentity[];

  @OneToMany(
    () => DigitalProfilePandetail,
    (digitalProfilePandetail) => digitalProfilePandetail.person
  )
  digitalProfilePandetails: DigitalProfilePandetail[];

  @OneToMany(
    () => DigitalProfilePassportdetail,
    (digitalProfilePassportdetail) => digitalProfilePassportdetail.person
  )
  digitalProfilePassportdetails: DigitalProfilePassportdetail[];

  @OneToMany(
    () => DigitalProfileSocialsecurity,
    (digitalProfileSocialsecurity) => digitalProfileSocialsecurity.person
  )
  digitalProfileSocialsecurities: DigitalProfileSocialsecurity[];

  @OneToMany(
    () => DigitalProfileVoterdetail,
    (digitalProfileVoterdetail) => digitalProfileVoterdetail.person
  )
  digitalProfileVoterdetails: DigitalProfileVoterdetail[];

  @OneToOne(
    () => DigitalProfileEducation,
    (digitalProfileEducation) => digitalProfileEducation.person
  )
  digitalProfileEducation: DigitalProfileEducation;
}
