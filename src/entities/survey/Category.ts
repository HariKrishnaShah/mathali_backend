import "reflect-metadata";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Question } from "./Question";
import { BaseEntity } from "../basic/Base";
import { Survey } from "./Survey";
@Entity()
export class Category extends BaseEntity {
  @Column({ name: "name", nullable: false, type: "text" })
  name: string;

  @Column({
    name: "allow_multiple_response",
    nullable: false,
    type: "boolean",
    default: false,
  })
  allowMultipleResponse: boolean;

  @ManyToMany(() => Question, (question) => question.categories, {
    cascade: true,
  })
  @JoinTable({ name: "question_categories" })
  questions: Question[];

  @ManyToMany(() => Survey, (survey) => survey.categories)
  surveys: Survey[];

  @Column({ name: "order_number", nullable: false, type: "integer" })
  orderNumber: number;
}
