import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_socialsecurity_pkey", ["id"], { unique: true })
@Entity("digital_profile_socialsecurity", { schema: "public" })
export class DigitalProfileSocialsecurity {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;
  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_social_security_card", nullable: true })
  hasSocialSecurityCard: boolean | null;

  @Column("character varying", {
    name: "social_security_no",
    nullable: true,
    length: 100,
  })
  socialSecurityNo: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileSocialsecurities
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
