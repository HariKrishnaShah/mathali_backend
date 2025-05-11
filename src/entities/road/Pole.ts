import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

// @Index("poles damak_pk", ["ogcFid"], { unique: true })
@Index("poles damak_wkb_geometry_geom_idx", ["wkbGeometry"], {})
@Entity("pole", { schema: "public" })
export class Pole {
  @PrimaryGeneratedColumn({ type: "integer", name: "ogc_fid" })
  ogcFid: number;

  @Column("geometry", { name: "wkb_geometry", nullable: true })
  wkbGeometry: string | null;

  @Column("numeric", { name: "id", nullable: true })
  id: string | null;

  @Column("numeric", { name: "ward", nullable: true })
  ward: string | null;
}
