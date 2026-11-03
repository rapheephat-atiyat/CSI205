import { Events } from "@/server/database/entities/event";
import { UserRole } from "@/server/database/entities/UserRole";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "stores", schema: "public" })
export class Store {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "event_id",
        type: "uuid",
    })
    eventId!: string;

    @ManyToOne(() => Events, (event) => event.stores, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events>;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "text", nullable: true })
    banner!: string | null;

    @Column({ type: "text", nullable: true })
    thumnail!: string | null;

    @OneToMany(() => UserRole, (userRole) => userRole.store)
    userRoles!: Relation<UserRole[]>;

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