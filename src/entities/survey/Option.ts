import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "../basic/Base";
import { Question } from "./Question";
import "reflect-metadata";
@Entity()
export class Option extends BaseEntity {
  @Column({ name: "value", type: "text", nullable: false })
  value: string;

  // Many options can belong to one question
  @ManyToOne(() => Question, (question) => question.options, {
    onDelete: "CASCADE",
  })
  question: Question;

  @Column({ name: "order_number", nullable: false, type: "integer" })
  orderNumber: number;
}
