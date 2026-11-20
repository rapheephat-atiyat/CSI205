"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";

export interface WalletOverviewProps {
  isVendor: boolean;
  userBalance: string | number;
  storeBalance?: string | number;
  storeName?: string;
  storeId?: string;
}

export function WalletOverview({
  isVendor,
  userBalance,
  storeBalance = "0.00",
  storeName = "ร้านค้าของคุณ",
  storeId,
}: WalletOverviewProps) {
  const formattedUserBalance = Number(userBalance || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedStoreBalance = Number(storeBalance || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-3">
      {/* Wallet Cards Grid: 1 column if regular user, 2 columns if vendor */}
      <div className={`grid gap-3 ${isVendor ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {/* ================= 1. USER WALLET (ทุกคนมีกระเป๋านี้) ================= */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>กระเป๋าส่วนตัว</span>
              <span className="font-mono text-[11px] text-zinc-400">User Wallet</span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
              {formattedUserBalance} Token
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between">
            <Link
              href="/account/wallet"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
            >
              <span>ประวัติการทำรายการ</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* ================= 2. STORE WALLET (แสดงเฉพาะบัญชีที่เป็นร้านค้า/VENDOR เท่านั้น) ================= */}
        {isVendor && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span className="truncate max-w-[160px] font-medium text-zinc-700">
                  {storeName}
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {storeId || "Store"}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                {formattedStoreBalance} Token
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <Link
                href="/vendor"
                className="font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                หน้าร้านค้า
              </Link>

              <Link
                href="/vendor/scan"
                className="font-medium text-[#b62b38] hover:text-[#941d27] inline-flex items-center gap-1 transition-colors"
              >
                <ScanLine className="size-3" />
                <span>สแกนรับเงิน</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
