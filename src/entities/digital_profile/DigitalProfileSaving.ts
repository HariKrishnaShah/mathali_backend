import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DigitalProfileHouse } from "./DigitalProfileHouse";

// @Index("digital_profile_saving_pkey", ["id"], { unique: true })
@Entity("digital_profile_saving", { schema: "public" })
export class DigitalProfileSaving {
  @PrimaryGeneratedColumn("increment", { name: "id" })
  id: number;
  @Column("timestamp without time zone", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at" })
  updatedAt: Date;

  @Column("character varying", {
    name: "saving_field",
    nullable: true,
    length: 100,
  })
  savingField: string | null;

  @Column("real", { name: "saving_amount", nullable: true })
  savingAmount: number | null;

  @ManyToOne(
    () => DigitalProfileHouse,
    (digitalProfileHouse) => digitalProfileHouse.digitalProfileSavings
  )
  @JoinColumn([{ name: "house_id", referencedColumnName: "houseId" }])
  house: DigitalProfileHouse;
}
