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

@Entity()
export class Sifarish extends BaseEntity {
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

  @ManyToOne(() => Cadastral, (cadastral) => cadastral.sifarish, {
    nullable: false,
  })
  cadastral: Cadastral;

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
