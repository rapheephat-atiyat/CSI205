import { FaqQuestion } from "@/server/database/entities/FaqQuestion";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from "typeorm";

@Entity({ name: "faq_categories", schema: "public" })
export class FaqCategory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255, default: "circle-question-mark" })
    icon!: string;

    @Column({ type: "integer", default: 0 })
    sortOrder!: number;

    @Column({ type: "boolean", default: false })
    isPublished!: boolean;

    @OneToMany(() => FaqQuestion, (question) => question.category)
    questions!: Relation<FaqQuestion[]>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}