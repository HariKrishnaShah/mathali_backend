import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../basic/Base";
import { User } from "../user/User";
import { Conversation } from "./conversation";

@Entity("chat", { schema: "public" })
export class Chat extends BaseEntity {
  @Column("character varying", {
    name: "name",
    nullable: false,
    default: "New Chat",
  })
  name: string | null;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @OneToMany(() => Conversation, (conversation) => conversation.chat)
  conversation: Conversation[];
}
