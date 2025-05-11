import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../basic/Base";
import { Option } from "./Option";
import { Answer } from "./Answer";
import "reflect-metadata";
import { Category } from "./Category";
import { Survey } from "./Survey";
enum questionType {
  TEXT = "text",
  NUMBER = "number",
  FREE_DETAIL_TEXT = "free_detail_text", // For longer free-text responses
  DROPDOWN = "dropdown", // For dropdown selections
  MULTIPLE_CHOICE_SINGLE_SELECT = "multiple_choice_single_select", // For single choice multiple selection
  MULTIPLE_CHOICE_MULTIPLE_SELECT = "multiple_choice_multiple_select", // For multiple choice, multiple selection
  DATE = "date", // For date input
  YES_NO = "yes_no", // For yes/no questions
  PHOTO = "photo",
  VIDEO = "video",
  PDF = "pdf",
}
@Entity()
export class Question extends BaseEntity {
  @Column({ name: "type", nullable: false, type: "enum", enum: questionType })
  type: questionType;

  @OneToMany(() => Option, (option) => option.question, { cascade: true })
  options: Option[];

  @Column({
    name: "is_required",
    nullable: false,
    type: "boolean",
    default: false,
  })
  isRequired: boolean;

  @Column({ name: "description", nullable: false, type: "text" })
  description: string;

  @ManyToMany(() => Category, (category) => category.questions)
  categories: Category[];

  @OneToMany(() => Answer, (answer) => answer.question, { cascade: true })
  answers: Answer[];

  @Column({ name: "order_number", nullable: false, type: "integer" })
  orderNumber: number;

  @Column({ name: "mapping_entity", nullable: true, type: "text" })
  mappingEntity: string;

  @Column({ name: "mapping_attribute", nullable: true, type: "text" })
  mappingAttribute: string;
}
