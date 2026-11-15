"use client";
import { ScannerBox, PaymentSummary } from "./components";

export default function VendorQRScannerPage() {
  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">QR Scanner</h1>
        <p className="text-sm text-gray-500 mt-1">
          ตรวจสอบจำนวน สแกน QR และยืนยันรับชำระ Token
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ฝั่งซ้าย: กล่องสแกน (บังคับกว้าง 65% ในจอใหญ่) */}
        <div className="w-full lg:w-[65%]">
          <ScannerBox />
        </div>

        {/* ฝั่งขวา: กล่องสรุปยอด (บังคับกว้าง 35% ในจอใหญ่) */}
        <div className="w-full lg:w-[35%]">
          <PaymentSummary />
        </div>
      </div>
    </div>
  );
}