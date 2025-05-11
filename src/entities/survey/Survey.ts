import { Column, Entity, JoinTable, OneToMany } from "typeorm";
import { BaseEntity } from "../basic/Base";
import { ManyToOne, ManyToMany } from "typeorm";
import { Response } from "./Response";
import { Question } from "./Question";
import "reflect-metadata";
import { Category } from "./Category";
@Entity()
export class Survey extends BaseEntity {
  @Column({ name: "name", nullable: false, type: "text" })
  name: string;

  @Column({ name: "code", nullable: false, type: "text" })
  code: string;

  @Column({ name: "description", nullable: false, type: "text" })
  description: string;

  @Column({ name: "is_active", nullable: false, type: "boolean" })
  isActive: boolean;

  @ManyToMany(() => Category, (category) => category.surveys, {
    cascade: true,
  })
  @JoinTable({ name: "survey_categories" })
  categories: Category[];

  @OneToMany(() => Response, (response) => response.survey, {
    cascade: true,
  })
  responses: Response[];

  @Column({
    name: "is_default",
    nullable: false,
    type: "boolean",
    default: false,
  })
  isDefault: boolean;

  @Column({
    name: "default_identifier",
    nullable: true,
    type: "text",
  })
  defaultIdentifier: string;
}
