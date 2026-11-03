import { EventSession } from "@/server/database/entities/EventSession";
import { Store } from "@/server/database/entities/Store";
import { UserRole } from "@/server/database/entities/UserRole";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "events", schema: "public" })
@Index("uq_events_slug", ["slug"], { unique: true })
export class Events {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    slug!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 255 })
    subTitle!: string;

    @Column({ type: "text" })
    banner!: string;

    @Column({ type: "text" })
    thumnail!: string;

    @Column({ type: "varchar", length: 255 })
    vanue!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "varchar", array: true, default: [] })
    tags!: string[];

    @OneToMany(() => EventSession, (es) => es.event)
    sessions!: Relation<EventSession[]>;

    @OneToMany(() => Store, (store) => store.event)
    stores!: Relation<Store[]>;

    @OneToMany(() => UserRole, (userRole) => userRole.event)
    userRoles!: Relation<UserRole[]>;

    @Column({ type: "timestamptz" })
    buyAt!: Date;

    @Column({ type: "timestamptz" })
    buyendAt!: Date;

    @Column({ type: "int", default: 1 })
    minTicketQTY!: number;

    @Column({ type: "int", default: 1 })
    maxTicketQTY!: number;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt!: Date;
}