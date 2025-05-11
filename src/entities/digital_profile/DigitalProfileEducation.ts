import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_education_pkey", ["id"], { unique: true })
@Entity("digital_profile_education", { schema: "public" })
export class DigitalProfileEducation {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "is_literate", nullable: true })
  isLiterate: boolean | null;

  @Column("character varying", {
    name: "education_degree",
    nullable: true,
    length: 50,
  })
  educationDegree: string | null;

  @Column("boolean", { name: "has_ended_study_abruptly", nullable: true })
  hasEndedStudyAbruptly: boolean | null;

  @Column("character varying", {
    name: "reason_to_end_study",
    nullable: true,
    length: 60,
  })
  reasonToEndStudy: string | null;

  @Column("character varying", {
    name: "branch_of_study",
    nullable: true,
    length: 50,
  })
  branchOfStudy: string | null;

  @Column("character varying", {
    name: "education_qualification_type",
    nullable: true,
    length: 50,
  })
  educationQualificationType: string | null;

  @Column("character varying", {
    name: "division_of_study",
    nullable: true,
    length: 50,
  })
  divisionOfStudy: string | null;

  @Column("real", { name: "percentage", nullable: true })
  percentage: number | null;

  @Column("real", { name: "gpa", nullable: true })
  gpa: number | null;

  @Column("character varying", {
    name: "education_institution_name",
    nullable: true,
    length: 50,
  })
  educationInstitutionName: string | null;

  @Column("character varying", {
    name: "education_passed_year",
    nullable: true,
    length: 50,
  })
  educationPassedYear: string | null;

  @OneToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilyMember) =>
      digitalProfileFamilyMember.digitalProfileEducation
  )
  @JoinColumn([{ name: "person_id" }])
  person: DigitalProfileFamilymember;
}
