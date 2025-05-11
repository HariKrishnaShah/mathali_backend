import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Role } from "../../types/common";
import "reflect-metadata";
import { BaseEntity } from "../basic/Base";
import { User } from "./User";

@Entity()
export class LoginLog extends BaseEntity {
  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onDelete: "CASCADE",
  })
  user: User;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  loginTime: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  ipAddress: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  userAgent: string;

  @Column({ type: "varchar", nullable: false })
  accessToken: string;

  @Column({ type: "varchar", nullable: false })
  refreshToken: string;

  @Column({
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ type: "timestamp", nullable: false })
  accessTokenExpiresAt: Date;

  @Column({ type: "timestamp", nullable: false })
  refreshTokenExpiresAt: Date;

  @Column({ type: "boolean", default: false })
  revoked: boolean; // Indicate if the token has been revoked
}
