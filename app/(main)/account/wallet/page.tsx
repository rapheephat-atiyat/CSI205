import { BookCard } from "@/components/book/BookUI";
import { Skeleton } from "@/components/ui/skeleton";
import type { WalletDetail, WalletHistoryItem } from "@/lib/api-types";
import { requirePageUser } from "@/server/auth/page-user";
import { getUserWallet } from "@/server/services/wallet.service";
import { Suspense } from "react";

export const metadata = { title: "กระเป๋าเงิน – TUATUA" };

export default function WalletPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <WalletContent />
        </Suspense>
    );
}

async function WalletContent() {
    const user = await requirePageUser("/account/wallet");
    const wallet = await getUserWallet(user.id);
    return <WalletView wallet={wallet} />;
}

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

const TX_LABELS: Record<WalletHistoryItem["type"], string> = {
    TOPUP: "เติมโทเคน",
    PURCHASE: "ซื้อสินค้า / บัตร",
    REFUND: "คืนโทเคน",
};

const TX_SIGN: Record<WalletHistoryItem["type"], "+" | "-"> = {
    TOPUP: "+",
    REFUND: "+",
    PURCHASE: "-",
};

function WalletView({ wallet }: { wallet: WalletDetail }) {
    const balance = Number(wallet.total);
    return (
        <div className="space-y-5">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">กระเป๋าเงิน</h1>
                <p className="text-sm text-muted-foreground">ยอดคงเหลือและประวัติการเคลื่อนไหว</p>
            </header>

            {/* Balance Card */}
            <BookCard title="ยอดคงเหลือ">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tabular-nums tracking-tight text-brand">
                        {currency.format(balance)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    ใช้โทเคนซื้อบัตร ของที่ระลึก หรือสินค้าในงาน
                </p>
            </BookCard>

            {/* History */}
            <BookCard title={`ประวัติล่าสุด (${wallet.histories.length} รายการ)`}>
                {wallet.histories.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีรายการเคลื่อนไหว</p>
                ) : (
                    <ul className="divide-y">
                        {wallet.histories.map((tx) => {
                            const sign = TX_SIGN[tx.type];
                            const isPositive = sign === "+";
                            return (
                                <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium">{TX_LABELS[tx.type]}</p>
                                        <p className="text-xs text-muted-foreground">{dateTime.format(new Date(tx.createdAt))}</p>
                                        {tx.note && <p className="text-xs text-muted-foreground wrap-anywhere">{tx.note}</p>}
                                    </div>
                                    <span className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
                                        {sign}{currency.format(Number(tx.amount))}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </BookCard>
        </div>
    );
}
