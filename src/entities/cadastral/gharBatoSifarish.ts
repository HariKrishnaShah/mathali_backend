import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../basic/Base";
import { v4 as uuidv4 } from "uuid";
import { Cadastral } from "./Cadastral";

export enum PavementType {
  BLACK_TOP = "पक्की सडक",
  EARTHEN = "माटो सडक",
  GRAVEL = "ग्राभेल सडक",
  CONCRETE = "कंक्रीट सडक",
  MIXED = "मिश्रित सडक",
}

@Entity("ghar_bato_sifarish")
export class GharBatoSifarish extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  ownerEng: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  ownerNepali: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  municipality: string;

  @Column({ type: "varchar", nullable: false })
  tole: string;

  @Column({ type: "varchar", length: 8, unique: true, nullable: false })
  uuid: string;

  @Column({ type: "boolean", nullable: false, default: true })
  isValid: boolean;

  @ManyToOne(() => Cadastral, (cadastral) => cadastral.valuationSifarish, {
    nullable: false,
  })
  cadastral: Cadastral;

  @Column({ type: "boolean", nullable: false, default: false })
  access_road_is_present: boolean;

  @Column({ type: "numeric", nullable: true })
  access_road_width: number;

  @Column({ type: "enum", nullable: true, enum: PavementType })
  access_road_pavement_type: PavementType;

  @Column({ type: "varchar", nullable: true })
  acess_road_name: string;

  @Column({ type: "boolean", nullable: false, default: false })
  secondary_road_is_present: boolean;

  @Column({ type: "numeric", nullable: true })
  secondary_road_width: number;

  @Column({ type: "enum", nullable: true, enum: PavementType })
  secondary_road_pavement_type: PavementType;

  @Column({ type: "varchar", nullable: true })
  secondary_road_name: string;

  @Column({ type: "boolean", nullable: false, default: false })
  main_road_is_present: boolean;

  @Column({ type: "numeric", nullable: true })
  main_road_width: number;

  @Column({ type: "enum", nullable: true, enum: PavementType })
  main_road_pavement_type: PavementType;

  @Column({ type: "varchar", nullable: true })
  main_road_name: string;

  @BeforeInsert()
  generateUUID() {
    // Generate a six-character alphanumeric UUID
    this.uuid = this.createUniqueUUID();
  }

  private createUniqueUUID(): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uuid = "";
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uuid += characters[randomIndex];
    }
    return uuid;
  }
}
