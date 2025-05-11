// Brick Factory Entity
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("brick_factory", { schema: "public" })
export class BrickFactory {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("character varying", { name: "name", nullable: true })
  name: string | null;

  @Column("numeric", { name: "ward", nullable: true, scale: 0 })
  ward: string | null;
}
