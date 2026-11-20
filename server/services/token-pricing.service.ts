import "server-only";
import type { TokenRate } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { TOKEN_PRICING_ID, TokenPricing } from "@/server/database/entities/TokenPricing";
import { recordAdminActivity } from "./admin-activity";
import { readMoney } from "./money";

export async function getTokenRate(): Promise<TokenRate> {
    const db = await getDatabase();
    const pricing = await db.getRepository(TokenPricing).findOneByOrFail({ id: TOKEN_PRICING_ID });
    return { bahtPerToken: pricing.bahtPerToken };
}

export async function updateTokenRate(actorId: string, value: unknown): Promise<TokenRate> {
    const bahtPerToken = readMoney(value).toFixed(2);
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const pricing = await manager.findOneOrFail(TokenPricing, {
            where: { id: TOKEN_PRICING_ID },
            lock: { mode: "pessimistic_write" },
        });
        if (pricing.bahtPerToken !== bahtPerToken) {
            const previous = pricing.bahtPerToken;
            pricing.bahtPerToken = bahtPerToken;
            await manager.save(pricing);
            await recordAdminActivity(manager, actorId, null, "token.rate.update", pricing.id, `${previous} → ${bahtPerToken} บาท/Token`);
        }
        return { bahtPerToken };
    });
}
