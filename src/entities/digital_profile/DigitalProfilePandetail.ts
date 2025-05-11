import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_pandetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_pandetail", { schema: "public" })
export class DigitalProfilePandetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_pan", nullable: true })
  hasPan: boolean | null;

  @Column("character varying", { name: "pan_no", nullable: true, length: 100 })
  panNo: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfilePandetails
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
