import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFaq1795088615422 implements MigrationInterface {
    name = 'AddFaq1795088615422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "faq_questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "category_id" uuid NOT NULL, "question" character varying(500) NOT NULL, "answer" text NOT NULL, "keywords" text array NOT NULL DEFAULT '{}', "linkLabel" character varying(150), "linkHref" text, "sortOrder" integer NOT NULL DEFAULT '0', "isPublished" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_763528586493656ef57ce31f9a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_faq_questions_category_order" ON "faq_questions"  ("category_id", "sortOrder") `);
        await queryRunner.query(`CREATE TABLE "faq_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "icon" character varying(255) NOT NULL DEFAULT 'circle-question-mark', "sortOrder" integer NOT NULL DEFAULT '0', "isPublished" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c3a7f838a99baed5cbcbc5372db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "faq_questions" ADD CONSTRAINT "FK_6611ddce0608d015ef95b47882b" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faq_questions" DROP CONSTRAINT "FK_6611ddce0608d015ef95b47882b"`);
        await queryRunner.query(`DROP TABLE "faq_categories"`);
        await queryRunner.query(`DROP INDEX "public"."idx_faq_questions_category_order"`);
        await queryRunner.query(`DROP TABLE "faq_questions"`);
    }

}
