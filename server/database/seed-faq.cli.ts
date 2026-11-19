import migrationDataSource from "./data-source.cli";
import { seedFaq } from "./seed-faq";

async function runSeed() {
    await migrationDataSource.initialize();
    try {
        const result = await migrationDataSource.transaction(seedFaq);
        console.log(`เพิ่ม FAQ ${result.createdCategories} หมวด ${result.createdQuestions} คำถาม (ข้ามรายการชื่อเดิม)`);
    } finally {
        await migrationDataSource.destroy();
    }
}

runSeed().catch((error: unknown) => {
    console.error("Seed FAQ ไม่สำเร็จ:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
