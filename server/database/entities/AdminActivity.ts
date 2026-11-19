import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { Events } from "./Event";
import { User } from "./User";

@Entity({ name: "admin_activities", schema: "public" })
@Index("idx_admin_activities_event_date", ["eventId", "createdAt"])
export class AdminActivity {
    @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "pk_admin_activities" })
    id!: string;

    @Column({ name: "event_id", type: "uuid", nullable: true })
    eventId!: string | null;

    @ManyToOne(() => Events, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "event_id", foreignKeyConstraintName: "fk_admin_activities_event" })
    event!: Relation<Events> | null;

    @Column({ name: "actor_id", type: "uuid", nullable: true })
    actorId!: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "actor_id", foreignKeyConstraintName: "fk_admin_activities_actor" })
    actor!: Relation<User> | null;

    @Column({ type: "varchar", length: 80 })
    action!: string;

    @Column({ name: "target_id", type: "uuid" })
    targetId!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    note!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
