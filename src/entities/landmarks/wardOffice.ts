import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
@Entity("ward_office", { schema: "public" })
export class WardOffice {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("character varying", { name: "name", nullable: true })
  name: string | null;

  @Column("numeric", { name: "ward", nullable: true, scale: 0 })
  ward: string | null;
}
