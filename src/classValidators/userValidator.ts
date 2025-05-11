import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsEnum,
} from "class-validator";
import { Role } from "../types/common";
import "reflect-metadata";

@Entity()
export class UserDTO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", unique: true })
  @IsEmail({}, { message: "Invalid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @Column({ type: "text" })
  @IsString({ message: "Password must be a string" })
  @Length(8, 255, { message: "Password must be at least 8 characters long" })
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.STAFF })
  @IsEnum(Role, { message: "Invalid role" })
  role: Role;

  @Column({ type: "varchar", length: 255 })
  @IsString({ message: "First name must be a string" })
  @IsNotEmpty({ message: "First name is required" })
  @Length(1, 255, {
    message: "First name must be between 1 and 255 characters",
  })
  firstName: string;

  @Column({ type: "varchar", length: 255 })
  @IsString({ message: "Last name must be a string" })
  @IsNotEmpty({ message: "Last name is required" })
  @Length(1, 255, { message: "Last name must be between 1 and 255 characters" })
  lastName: string;

  @Column({ type: "varchar", length: 20 })
  @IsString({ message: "Phone number must be a string" })
  @Length(10, 20, { message: "Phone number must be between 10 and 20 digits" })
  phone: string;

  @Column({ type: "varchar", length: 255 })
  @IsString({ message: "Address must be a string" })
  @Length(1, 255, { message: "Address must be between 1 and 255 characters" })
  address: string;

  @Column({ type: "varchar", length: 255 })
  @IsString({ message: "Position must be a string" })
  @Length(1, 255, { message: "Position must be between 1 and 255 characters" })
  position: string;
}
