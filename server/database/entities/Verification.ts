import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "verifications", schema: "public" })
export class Verification {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    identifier!: string;

    @Column({ type: "text" })
    value!: string;

    @Column({ type: "timestamptz" })
    expiresAt!: Date;

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