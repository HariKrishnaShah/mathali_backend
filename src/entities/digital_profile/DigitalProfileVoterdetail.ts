import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileFamilymember } from "./DigitalProfileFamilymember";

// @Index("digital_profile_voterdetail_pkey", ["id"], { unique: true })
@Entity("digital_profile_voterdetail", { schema: "public" })
export class DigitalProfileVoterdetail {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("boolean", { name: "has_voter_card", nullable: true })
  hasVoterCard: boolean | null;

  @Column("character varying", {
    name: "voter_card_no",
    nullable: true,
    length: 100,
  })
  voterCardNo: string | null;

  @Column("character varying", {
    name: "voting_place",
    nullable: true,
    length: 100,
  })
  votingPlace: string | null;

  @ManyToOne(
    () => DigitalProfileFamilymember,
    (digitalProfileFamilymember) =>
      digitalProfileFamilymember.digitalProfileVoterdetails
  )
  @JoinColumn([{ name: "person_id", referencedColumnName: "personId" }])
  person: DigitalProfileFamilymember;
}
