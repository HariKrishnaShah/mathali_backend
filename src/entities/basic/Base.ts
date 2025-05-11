import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  BaseEntity as TypeORMBaseEntity, Column
} from "typeorm";

@Entity()
export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ type: "numeric", nullable: true })
  modifiedBy: number;
  // Add other common fields here if needed
}
