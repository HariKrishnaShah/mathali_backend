import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_healthstatus_pkey", ["id"], { unique: true })
@Entity("digital_profile_healthstatus", { schema: "public" })
export class DigitalProfileHealthstatus {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "status_of_health",
    nullable: true,
    length: 50,
  })
  statusOfHealth: string | null;

  @Column("character varying", {
    name: "disease_name",
    nullable: true,
    length: 50,
  })
  diseaseName: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileHealthstatuses
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
