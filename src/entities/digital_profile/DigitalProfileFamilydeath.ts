import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_familydeath_pkey", ["id"], { unique: true })
@Entity("digital_profile_familydeath", { schema: "public" })
export class DigitalProfileFamilydeath {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "death_person_name",
    nullable: true,
    length: 80,
  })
  deathPersonName: string | null;

  @Column("character varying", {
    name: "relationship",
    nullable: true,
    length: 80,
  })
  relationship: string | null;

  @Column("character varying", { name: "gender", nullable: true, length: 10 })
  gender: string | null;

  @Column("numeric", { name: "age", nullable: true })
  age: string | null;

  @Column("character varying", {
    name: "reason_of_death",
    nullable: true,
    length: 80,
  })
  reasonOfDeath: string | null;

  @Column("boolean", { name: "was_pregnant", nullable: true })
  wasPregnant: boolean | null;

  @Column("boolean", { name: "has_newborn", nullable: true })
  hasNewborn: boolean | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileFamilydeaths
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
