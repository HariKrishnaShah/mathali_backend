import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Question } from "./Question";
import { Response } from "./Response";
import "reflect-metadata";
import { BaseEntity } from "../basic/Base";
@Entity()
export class Answer extends BaseEntity {
  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: "CASCADE",
  })
  question: Question;

  @Column({ name: "answer", type: "text", nullable: false })
  answer: string;

  @ManyToOne(() => Response, (response) => response.answers, {
    onDelete: "CASCADE",
  })
  response: Response;

  // Add the groupId column to group answers that belong together (e.g., for the same family member)
  @Column({
    name: "group_id",
    type: "text",
    nullable: true,
    default: "ungrouped",
  })
  groupId: string;
}
