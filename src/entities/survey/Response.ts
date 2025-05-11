import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Answer } from "./Answer";
import "reflect-metadata";
import { BaseEntity } from "../basic/Base";
import { Survey } from "./Survey";
import { User } from "../user/User";
@Entity()
export class Response extends BaseEntity {
  @ManyToOne(() => Survey, (survey) => survey.responses, {
    onDelete: "CASCADE",
  })
  survey: Survey;

  @Column({ name: "google_plus_code", type: "text", nullable: true })
  googlePlusCode: string;

  @ManyToOne(() => User, (user) => user.responses) // Establish relation to User
  surveyTakenBy: User; // Replace numeric type with User relation

  @OneToMany(() => Answer, (answer) => answer.response, { cascade: true })
  answers: Answer[];

  @Column({
    type: "decimal",
    precision: 9,
    scale: 6,
    nullable: true,
    name: "survey_taken_place_latitude",
  })
  surveyTakenPlaceLatitude: number;

  @Column({
    type: "decimal",
    precision: 9,
    scale: 6,
    nullable: true,
    name: "survey_taken_place_longitude",
  })
  surveyTakenPlaceLongitude: number;

  @Column({
    type: "decimal",
    precision: 9,
    scale: 6,
    nullable: true,
    name: "house_latitude",
  })
  houseLatitude: number;

  @Column({
    type: "decimal",
    precision: 9,
    scale: 6,
    nullable: true,
    name: "house_longitude",
  })
  houseLongitude: number;

  @Column({
    type: "boolean",
    nullable: false,
    name: "is_imported",
    default: false,
  })
  is_imported: boolean;
}
