import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_epidemicdetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_epidemicdetail", { schema: "public" })
export class DigitalProfileEpidemicdetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_pandemic_infected", nullable: true })
  hasPandemicInfected: boolean | null;

  @Column("character varying", {
    name: "pandemic_name",
    nullable: true,
    length: 100,
  })
  pandemicName: string | null;

  @Column("text", { name: "date_of_infection", nullable: true })
  dateOfInfection: string | null;

  @Column("text", { name: "symptoms_of_pandemic", nullable: true })
  symptomsOfPandemic: string | null;

  @Column("text", { name: "stay_after_contaminated", nullable: true })
  stayAfterContaminated: string | null;

  @Column("boolean", { name: "has_need_of_oxygen", nullable: true })
  hasNeedOfOxygen: boolean;

  @Column("integer", {
    name: "days_to_discharge_from_hospital",
    nullable: true,
  })
  daysToDischargeFromHospital: number | null;

  @Column("boolean", { name: "has_covid19_vaccine_taken", nullable: true })
  hasCovid19VaccineTaken: boolean;

  @Column("character varying", {
    name: "dose_of_vaccine",
    nullable: true,
    length: 50,
  })
  doseOfVaccine: string | null;

  @Column("character varying", {
    name: "covid19_vaccine_taken_name",
    nullable: true,
    length: 50,
  })
  covid19VaccineTakenName: string | null;

  @Column("boolean", { name: "has_health_insurance", nullable: true })
  hasHealthInsurance: boolean | null;

  @Column("boolean", {
    name: "has_account_bank_or_other_institution",
    nullable: true,
  })
  hasAccountBankOrOtherInstitution: boolean | null;

  @Column("character varying", {
    name: "bank_or_other_institution_name",
    nullable: true,
    length: 50,
  })
  bankOrOtherInstitutionName: string | null;

  @Column("boolean", { name: "is_veg", nullable: true })
  isVeg: boolean | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileEpidemicdetails
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
