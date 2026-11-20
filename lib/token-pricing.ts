export const MAX_TICKET_TOKEN_REWARD = 99_999_999;

export function calculateTopUpBaht(tokens: number, bahtPerToken: number): string {
    const tokenHundredths = BigInt(Math.round(tokens * 100));
    const satangPerToken = BigInt(Math.round(bahtPerToken * 100));
    const hundred = BigInt(100);
    const satang = (tokenHundredths * satangPerToken + BigInt(50)) / hundred;
    return `${satang / hundred}.${String(satang % hundred).padStart(2, "0")}`;
}
