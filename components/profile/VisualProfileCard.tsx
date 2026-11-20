"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  RotateCcw,
  Copy,
  Check,
  Download,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

export interface VisualCardProps {
  userId: string;
  memberCode: string;
  displayName: string;
  username: string;
  role: string;
  isVendor: boolean;
  walletBalance: string | number;
  storeName?: string;
}

export function VisualProfileCard({
  userId,
  memberCode,
  displayName,
  username,
  isVendor,
  walletBalance,
  storeName,
}: VisualCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [isCopied, setIsCopied] = React.useState(false);

  // Generate personal QR Code
  React.useEffect(() => {
    let isMounted = true;
    const qrPayload = JSON.stringify({
      protocol: "tuatua",
      type: "USER_PAYMENT",
      userId: userId || memberCode,
      username: username,
      name: displayName,
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, memberCode, username, displayName]);

  const handleCopyId = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const idToCopy = memberCode || userId;
    navigator.clipboard.writeText(idToCopy);
    setIsCopied(true);
    toast.success("คัดลอกรหัสแล้ว", { description: idToCopy });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${username || memberCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("บันทึก QR Code แล้ว");
  };

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsFlipped((prev) => !prev);
    }
  };

  const formattedBalance = Number(walletBalance || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="w-full max-w-[380px] mx-auto flex flex-col items-center">
      {/* 3D Flip Card */}
      <div
        className="w-full cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-pressed={isFlipped}
        aria-label="บัตรสมาชิก แตะเพื่อพลิกดู QR Code"
      >
        <div
          className="relative w-full aspect-[1.586/1] rounded-2xl transition-transform duration-500 ease-in-out shadow-lg"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ================= FRONT ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden p-6 flex flex-col justify-between border border-zinc-800 bg-zinc-900 text-white"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-sm tracking-wide text-zinc-100">TUATUA</div>
              </div>

              <div className="flex items-center gap-2">
                <Wifi className="size-4 text-zinc-500 rotate-90" />
              </div>
            </div>

            {/* Chip only */}
            <div className="flex items-center py-2">
              <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300/60" />
            </div>

            {/* Bottom info */}
            <div className="pt-2 border-t border-zinc-800 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase text-zinc-400">ผู้ถือบัตร</div>
                <div className="text-sm font-semibold text-white truncate max-w-[180px]">
                  {displayName || "สมาชิก"}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase text-zinc-400">ยอดเงิน</div>
                <div className="text-sm font-mono font-semibold text-zinc-100">
                  {formattedBalance} Token
                </div>
              </div>
            </div>
          </div>

          {/* ================= BACK ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between border border-zinc-800 bg-zinc-900 text-white"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-zinc-200">QR Code ประจำตัว</div>
              <div className="text-[10px] text-zinc-400">สำหรับชำระเงินและเติมเงิน</div>
            </div>

            {/* QR Code Container */}
            <div className="flex items-center justify-center my-auto">
              <div className="p-2 rounded-xl bg-white flex items-center justify-center shadow-md">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="User QR Code"
                    className="size-24 rounded object-contain"
                  />
                ) : (
                  <div className="size-24 rounded bg-zinc-100" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800 pt-2">
              <span className="font-mono">{memberCode || userId}</span>
              <span className="text-[10px] text-zinc-400">{isVendor && storeName ? storeName : "TUATUA"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal helper text & subtle actions */}
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <button
          type="button"
          onClick={handleCardClick}
          className="hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>{isFlipped ? "ดูหน้าบัตร" : "พลิกดู QR"}</span>
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={handleDownloadQr}
          className="hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Download className="size-3" />
          <span>ดาวน์โหลด</span>
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={handleCopyId}
          className="hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isCopied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
          <span>{isCopied ? "คัดลอกแล้ว" : "คัดลอกรหัส"}</span>
        </button>
      </div>
    </div>
  );
}
