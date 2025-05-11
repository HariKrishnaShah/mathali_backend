import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("temple", { schema: "public" })
export class Temple {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("character varying", { name: "category", nullable: true })
  @Column("character varying", { name: "name", nullable: true })
  name: string | null;

  @Column("numeric", { name: "ward", nullable: true, scale: 0 })
  ward: string | null;
}
