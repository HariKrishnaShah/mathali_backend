import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Role } from "../../types/common";
import "reflect-metadata";
import { BaseEntity } from "../basic/Base";
import { LoginLog } from "./LoginLog";
import { Response } from "../survey/Response";
import { CadastralUpdateRequest } from "../cadastral/CadastralUpdateRequest";
import { Chat } from "../chatbot/chat";
@Entity()
export class User extends BaseEntity {
  @Column({ type: "varchar", unique: true, nullable: false })
  email: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.STAFF, nullable: false })
  role: Role;

  @Column({ type: "varchar", length: 255, nullable: false })
  firstName: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  lastName: string;

  @Column({ type: "varchar", length: 20, nullable: false })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  address: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  position: string;

  @Column({ type: "boolean", nullable: false, default: false })
  blocked: boolean;

  @OneToMany(() => LoginLog, (loginLog) => loginLog.user, { cascade: true })
  loginLog: LoginLog[];

  @OneToMany(() => Response, (response) => response.surveyTakenBy) // Establish relationship with Response
  responses: Response[];

  @OneToMany(
    () => CadastralUpdateRequest,
    (cadastralUpdateRequest) => cadastralUpdateRequest.user
  ) // Establish relationship with Response
  cadastralUpdateRequests: CadastralUpdateRequest[];

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];
}
