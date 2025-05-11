import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_loan_pkey", ["id"], { unique: true })
@Entity("digital_profile_loan", { schema: "public" })
export class DigitalProfileLoan {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "loan_for",
    nullable: true,
    length: 100,
  })
  loanFor: string | null;

  @Column("character varying", {
    name: "source_of_loan",
    nullable: true,
    length: 100,
  })
  sourceOfLoan: string | null;

  @Column("real", { name: "loan_amount", nullable: true })
  loanAmount: number | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileLoans
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
