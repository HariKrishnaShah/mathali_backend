import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileAgriculturecashcrop } from "./DigitalProfileAgriculturecashcrop";
import { DigitalProfileAgricultureflowers } from "./DigitalProfileAgricultureflowers";
import { DigitalProfileAgriculturefoodcrop } from "./DigitalProfileAgriculturefoodcrop";
import { DigitalProfileAgriculturefruits } from "./DigitalProfileAgriculturefruits";
import { DigitalProfileAgricultureoilseeds } from "./DigitalProfileAgricultureoilseeds";
import { DigitalProfileAgriculturepulses } from "./DigitalProfileAgriculturepulses";
import { DigitalProfileAgriculturevegetable } from "./DigitalProfileAgriculturevegetable";
import { DigitalProfileBuildingdetail } from "./DigitalProfileBuildingdetail";
import { DigitalProfileCookingfuel } from "./DigitalProfileCookingfuel";
import { DigitalProfileDrinkingwatersurvey } from "./DigitalProfileDrinkingwatersurvey";
import { DigitalProfileEducation } from "./DigitalProfileEducation";
import { DigitalProfileExpense } from "./DigitalProfileExpense";
import { DigitalProfileFamilydeath } from "./DigitalProfileFamilydeath";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";
import { DigitalProfileHealthtreatment } from "./DigitalProfileHealthtreatment";
import { DigitalProfileLand } from "./DigitalProfileLand";
import { DigitalProfileLightingsource } from "./DigitalProfileLightingsource";
import { DigitalProfileLoan } from "./DigitalProfileLoan";
import { DigitalProfileSaving } from "./DigitalProfileSaving";
import { DigitalProfileSchool } from "./DigitalProfileSchool";
import { DigitalProfileToilet } from "./DigitalProfileToilet";

// @Index("digital_profile_house_pkey", ["houseId"], { unique: true })
@Entity("digital_profile_house", { schema: "public" })
export class DigitalProfileHouse {
  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("real", { name: "latitude", nullable: true })
  latitude: number | null;

  @Column("real", { name: "longitude", nullable: true })
  longitude: number | null;

  @Column("integer", { name: "ward_no", nullable: true })
  wardNo: number | null;

  @Column("character varying", {
    name: "google_plus_code",
    nullable: true,
    length: 100,
  })
  googlePlusCode: string | null;

  @Column("character varying", {
    name: "district",
    nullable: true,
    length: 100,
  })
  district: string | null;

  @Column("character varying", {
    name: "province",
    nullable: true,
    length: 100,
  })
  province: string | null;

  @Column("character varying", {
    name: "owner_eng",
    nullable: true,
    length: 100,
  })
  ownerEng: string | null;

  @Column("character varying", {
    name: "owner_nepali",
    nullable: true,
    length: 100,
  })
  ownerNepali: string | null;

  @Column("integer", { name: "total_family_members", nullable: true })
  totalFamilyMembers: number | null;

  @Column("boolean", { name: "family_death_within_1_year", nullable: true })
  familyDeathWithin_1Year: boolean | null;

  @PrimaryGeneratedColumn("increment", { name: "id" })
  houseId: number;

  @OneToMany(
    () => DigitalProfileAgriculturecashcrop,
    (digitalProfileAgriculturecashcrop) =>
      digitalProfileAgriculturecashcrop.house
  )
  digitalProfileAgriculturecashcrops: DigitalProfileAgriculturecashcrop[];

  @OneToMany(
    () => DigitalProfileAgricultureflowers,
    (digitalProfileAgricultureflowers) => digitalProfileAgricultureflowers.house
  )
  digitalProfileAgricultureflowers: DigitalProfileAgricultureflowers[];

  @OneToMany(
    () => DigitalProfileAgriculturefoodcrop,
    (digitalProfileAgriculturefoodcrop) =>
      digitalProfileAgriculturefoodcrop.house
  )
  digitalProfileAgriculturefoodcrops: DigitalProfileAgriculturefoodcrop[];

  @OneToMany(
    () => DigitalProfileAgriculturefruits,
    (digitalProfileAgriculturefruits) => digitalProfileAgriculturefruits.house
  )
  digitalProfileAgriculturefruits: DigitalProfileAgriculturefruits[];

  @OneToMany(
    () => DigitalProfileAgricultureoilseeds,
    (digitalProfileAgricultureoilseeds) =>
      digitalProfileAgricultureoilseeds.house
  )
  digitalProfileAgricultureoilseeds: DigitalProfileAgricultureoilseeds[];

  @OneToMany(
    () => DigitalProfileAgriculturepulses,
    (digitalProfileAgriculturepulses) => digitalProfileAgriculturepulses.house
  )
  digitalProfileAgriculturepulses: DigitalProfileAgriculturepulses[];

  @OneToMany(
    () => DigitalProfileAgriculturevegetable,
    (digitalProfileAgriculturevegetable) =>
      digitalProfileAgriculturevegetable.house
  )
  digitalProfileAgriculturevegetables: DigitalProfileAgriculturevegetable[];

  @OneToMany(
    () => DigitalProfileBuildingdetail,
    (digitalProfileBuildingdetail) => digitalProfileBuildingdetail.house
  )
  digitalProfileBuildingdetails: DigitalProfileBuildingdetail[];

  @OneToMany(
    () => DigitalProfileCookingfuel,
    (digitalProfileCookingfuel) => digitalProfileCookingfuel.house
  )
  digitalProfileCookingfuels: DigitalProfileCookingfuel[];

  @OneToMany(
    () => DigitalProfileDrinkingwatersurvey,
    (digitalProfileDrinkingwatersurvey) =>
      digitalProfileDrinkingwatersurvey.house
  )
  digitalProfileDrinkingwatersurveys: DigitalProfileDrinkingwatersurvey[];

  digitalProfileEducations: DigitalProfileEducation[];

  @OneToMany(
    () => DigitalProfileExpense,
    (digitalProfileExpense) => digitalProfileExpense.house
  )
  digitalProfileExpenses: DigitalProfileExpense[];

  @OneToMany(
    () => DigitalProfileFamilydeath,
    (digitalProfileFamilydeath) => digitalProfileFamilydeath.house
  )
  digitalProfileFamilydeaths: DigitalProfileFamilydeath[];

  @OneToMany(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) => digitalProfileFamilymember.house
  )
  digitalProfileFamilymembers: DigitalProfileFamilymember[];

  @OneToMany(
    () => DigitalProfileHealthtreatment,
    (digitalProfileHealthtreatment) => digitalProfileHealthtreatment.house
  )
  digitalProfileHealthtreatments: DigitalProfileHealthtreatment[];

  @OneToMany(
    () => DigitalProfileLand,
    (digitalProfileLand) => digitalProfileLand.house
  )
  digitalProfileLands: DigitalProfileLand[];

  @OneToMany(
    () => DigitalProfileLightingsource,
    (digitalProfileLightingsource) => digitalProfileLightingsource.house
  )
  digitalProfileLightingsources: DigitalProfileLightingsource[];

  @OneToMany(
    () => DigitalProfileLoan,
    (digitalProfileLoan) => digitalProfileLoan.house
  )
  digitalProfileLoans: DigitalProfileLoan[];

  @OneToMany(
    () => DigitalProfileSaving,
    (digitalProfileSaving) => digitalProfileSaving.house
  )
  digitalProfileSavings: DigitalProfileSaving[];

  @OneToMany(
    () => DigitalProfileSchool,
    (digitalProfileSchool) => digitalProfileSchool.house
  )
  digitalProfileSchools: DigitalProfileSchool[];

  @OneToMany(
    () => DigitalProfileToilet,
    (digitalProfileToilet) => digitalProfileToilet.house
  )
  digitalProfileToilets: DigitalProfileToilet[];
}
