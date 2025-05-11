import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseEntity } from "../basic/Base";
import { User } from "../user/User";
import { Cadastral } from "./Cadastral";

export enum statusEnum {
  PENDING = "pending",
  REJECTED = "rejected",
  APPROVED = "approved",
}

@Entity("cadastral_update_request", { schema: "public" })
export class CadastralUpdateRequest {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("numeric", {
    name: "parcel_no",
    nullable: false,
    precision: 10,
    scale: 0,
  })
  parcelNo: number;

  @Column("character varying", { name: "ward_no", nullable: false })
  wardNo: string | null;

  @Column("character varying", { name: "sheet_no", nullable: false })
  sheetNo: string | null;

  @Column("character varying", { name: "zone", nullable: false })
  zone: string | null;

  @Column("character varying", { name: "zone_nepali", nullable: true })
  zoneNepali: string | null;

  @Column("character varying", { name: "former_vdc", nullable: false })
  formerVdc: string | null;

  @Column("character varying", { name: "remarks", nullable: true })
  remarks: string | null;

  @ManyToOne(() => User, (user) => user.cadastralUpdateRequests) // Establish relation to User
  user: User; // Replace numeric type with User relation

  @ManyToOne(() => Cadastral, (cadastral) => cadastral.cadastralUpdateRequests) // Establish relation to User
  cadastral: Cadastral; // Replace numeric type with User relation

  @Column("character varying", { name: "user_comment", nullable: true })
  userComment: string | null;

  @Column({ name: "valuation", nullable: true, type: "real" })
  valuation: number | null;

  @Column("enum", {
    name: "status",
    default: statusEnum.PENDING,
    enum: statusEnum,
  })
  status: statusEnum;
}
