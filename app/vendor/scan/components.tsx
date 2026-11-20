"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { useVendorStore } from "@/components/vendor/vendor-store-context";
import { api } from "@/lib/api-client";
import { Camera, CheckCircle2, Keyboard, X, XCircle } from "lucide-react";

// ตรวจสอบรูปแบบ UUID (8-4-4-4-12 ตัวอักษร 0-9 และ a-f)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getPaymentUserId(rawCode: string): string | null {
  const trimmed = rawCode.trim();
  if (UUID_REGEX.test(trimmed)) return trimmed;

  try {
    const payload: unknown = JSON.parse(trimmed);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    const paymentQr = payload as Record<string, unknown>;
    if (
      paymentQr.protocol === "tuatua" &&
      paymentQr.type === "USER_PAYMENT" &&
      typeof paymentQr.userId === "string" &&
      UUID_REGEX.test(paymentQr.userId)
    ) {
      return paymentQr.userId;
    }
  } catch {
    return null;
  }

  return null;
}

export function ScannerBox() {
  const { selectedStore } = useVendorStore();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraRequestRef = useRef(0);
  const paymentInProgressRef = useRef(false);

  const storeName = selectedStore?.name ?? "ร้านค้า";
  const productTitle = selectedStore?.product?.title ?? "สินค้าของร้าน";
  const productPrice = Number(selectedStore?.product?.price ?? 0);

  const stopCamera = async () => {
    cameraRequestRef.current++;
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ข้าม error กรณีกล้องหยุดอยู่แล้ว
      } finally {
        scannerRef.current = null;
      }
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      cameraRequestRef.current = -1;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ตรวจสอบความถูกต้องของรหัสก่อนเปิด Modal ยืนยัน
  const processScannedCode = (rawCode: string) => {
    const userId = getPaymentUserId(rawCode);
    if (!userId) {
      setCameraError(
        "QR ไม่ถูกต้อง กรุณาสแกน QR ชำระเงินจากบัตรสมาชิก หรือกรอกรหัสผู้ใช้ UUID"
      );
      return;
    }
    setCameraError(null);
    setPaymentError(null);
    setPaymentSuccess(null);
    setScannedResult(userId);
  };

  const handleOpenCamera = async () => {
    setScannedResult(null);
    setCameraError(null);
    setPaymentSuccess(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "เบราว์เซอร์บล็อกการใช้งานกล้อง (เปิดผ่าน localhost / HTTPS) — คุณสามารถกรอกรหัส QR ด้านล่างแทนได้"
      );
      return;
    }

    setIsCameraOpen(true);
    const requestId = ++cameraRequestRef.current;

    requestAnimationFrame(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (requestId !== cameraRequestRef.current) return;
        const html5QrCode = new Html5Qrcode("vendor-qr-reader");
        scannerRef.current = html5QrCode;

        const qrConfig = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        };

        const onScanSuccess = (decodedText: string) => {
          stopCamera();
          processScannedCode(decodedText);
        };

        try {
          // บังคับเรียกใช้กล้องหลัง (environment) เป็นอันดับแรก
          await html5QrCode.start(
            { facingMode: "environment" },
            qrConfig,
            onScanSuccess,
            () => {}
          );
        } catch {
          if (requestId !== cameraRequestRef.current) return;
          // กรณีอุปกรณ์ไม่รองรับ facingMode (เช่น PC บางรุ่น) ให้ดึงรายการกล้องมาเลือกสำรอง
          const devices = await Html5Qrcode.getCameras();
          if (requestId !== cameraRequestRef.current) return;
          if (!devices || devices.length === 0) {
            throw new Error("NotFoundError");
          }

          const backCamera = devices.find((d) => {
            const label = d.label.toLowerCase();
            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes("environment") ||
              label.includes("หลัง")
            );
          });

          // บนมือถือถ้าหาชื่อไม่เจอ กล้องหลังมักจะอยู่ตัวสุดท้ายของลิสต์ (devices[devices.length - 1])
          const fallbackCameraId = backCamera
            ? backCamera.id
            : devices[devices.length - 1].id;

          await html5QrCode.start(
            fallbackCameraId,
            qrConfig,
            onScanSuccess,
            () => {}
          );
        }
        if (requestId !== cameraRequestRef.current) {
          await html5QrCode.stop().catch(() => {});
          if (scannerRef.current === html5QrCode) {
            html5QrCode.clear();
            scannerRef.current = null;
          }
        }
      } catch (err) {
        if (requestId !== cameraRequestRef.current) return;
        const rawMsg =
          err instanceof Error ? `${err.name}: ${err.message}` : String(err);

        if (rawMsg.includes("NotAllowedError") || rawMsg.includes("Permission")) {
          setCameraError(
            "ยังไม่ได้รับสิทธิ์เปิดกล้อง — กรุณากดอนุญาตกล้องบนเบราว์เซอร์ หรือกรอกรหัส QR ด้านล่างแทน"
          );
        } else if (
          rawMsg.includes("NotFoundError") ||
          rawMsg.includes("Requested device not found")
        ) {
          setCameraError(
            "ไม่พบกล้องบนอุปกรณ์นี้ — กรุณากรอกรหัส QR ในช่องด้านล่างแทน"
          );
        } else if (rawMsg.includes("NotReadableError") || rawMsg.includes("in use")) {
          setCameraError(
            "กล้องกำลังถูกใช้งานโดยโปรแกรมอื่นอยู่ — กรุณากรอกรหัส QR ในช่องด้านล่างแทน"
          );
        } else {
          setCameraError(
            `ไม่สามารถเปิดกล้องได้ (${rawMsg}) — สามารถกรอกรหัส QR ด้านล่างแทนได้`
          );
        }
        setIsCameraOpen(false);
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    if (isCameraOpen) {
      stopCamera();
    }
    processScannedCode(manualCode);
  };

  const handleCancelModal = () => {
    setScannedResult(null);
    setPaymentError(null);
  };

  const handleConfirmPayment = async () => {
    if (
      !scannedResult ||
      !selectedStore?.product ||
      productPrice <= 0 ||
      paymentInProgressRef.current
    ) return;

    paymentInProgressRef.current = true;
    setIsPaying(true);
    setPaymentError(null);
    try {
      const result = await api.store.sell(
        {
          customerUserId: scannedResult,
          amount: selectedStore.product.price,
          note: productTitle,
        },
        selectedStore.id,
      );
      if (!result.success) {
        setPaymentError(result.error.message);
        return;
      }

      setPaymentSuccess({ code: scannedResult, amount: productPrice });
      setScannedResult(null);
      setManualCode("");
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "รับชำระไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      paymentInProgressRef.current = false;
      setIsPaying(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* กล่องที่ 1: สแกน QR ด้วยกล้อง */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">สแกน QR เพื่อรับชำระ</h2>

            {isCameraOpen && (
              <button
                type="button"
                onClick={stopCamera}
                className="text-sm text-gray-500 hover:text-red-500 font-bold underline cursor-pointer"
              >
                ปิดกล้อง
              </button>
            )}
          </div>

          {/* แจ้งเตือนหากเปิดกล้องไม่สำเร็จ หรือรหัส QR ไม่ใช่ UUID */}
          {cameraError && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span className="break-all">{cameraError}</span>
            </div>
          )}

          {/* แจ้งเตือนเมื่อยืนยันรับชำระสำเร็จ */}
          {paymentSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-emerald-800 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="truncate">
                  รับชำระ <span className="font-bold">{paymentSuccess.amount.toLocaleString()} Token</span>{" "}
                  จากรหัส <span className="font-mono font-semibold">{paymentSuccess.code}</span> สำเร็จแล้ว
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSuccess(null)}
                className="text-emerald-600 hover:text-emerald-800 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* พื้นที่กล้อง */}
          {isCameraOpen ? (
            <div className="relative w-full bg-gray-950 rounded-xl overflow-hidden flex flex-col items-center justify-center p-2">
              <div
                id="vendor-qr-reader"
                className="w-full max-w-[420px] overflow-hidden rounded-lg"
              />
              <p className="text-xs text-white/80 py-2.5">
                นำ QR Code ของลูกค้ามาวางให้อยู่ในกรอบสี่เหลี่ยม
              </p>
            </div>
          ) : (
            <div className="w-full h-[340px] bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-4 p-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold text-sm">
                  พร้อมรับชำระด้วย QR Code
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  คลิกปุ่มด้านล่างเพื่อเปิดกล้องสแกน
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCamera}
                className="inline-flex items-center gap-2 bg-[#E53935] hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                เปิดกล้องสแกน
              </button>
            </div>
          )}
        </div>

        {/* กล่องที่ 2: กรอกรหัส QR เอง (สำรองเผื่อเปิดกล้องไม่ได้) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Keyboard className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-bold text-gray-900">กรอกรหัส QR เอง</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            ใช้ในกรณีที่เปิดกล้องไม่ได้ โดยกรอกรหัสผู้ใช้ UUID 36 หลัก
          </p>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="เช่น 550e8400-e29b-41d4-a716-446655440000"
              autoComplete="off"
              className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-[#E53935] hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              ตกลง
            </button>
          </form>
        </div>
      </div>

      {/* Modal ยืนยันการหักเงิน */}
      {scannedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                ยืนยันการรับชำระ Token
              </h3>
              <button
                type="button"
                onClick={handleCancelModal}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ร้านค้า</span>
                <span className="font-semibold text-gray-800">{storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">รายการสินค้า</span>
                <span className="font-semibold text-gray-800">{productTitle}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-gray-500">รหัสผู้ชำระ (UUID)</span>
                <span className="font-mono text-[11px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 break-all">
                  {scannedResult}
                </span>
              </div>
              <div className="pt-2.5 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-700">ยอดที่ต้องหัก</span>
                <span className="text-lg font-bold text-[#E53935]">
                  {productPrice.toLocaleString()} Token
                </span>
              </div>
            </div>

            {(!selectedStore?.product || productPrice <= 0) && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                ร้านนี้ยังไม่มีสินค้าหรือราคาที่รับชำระได้
              </p>
            )}
            {paymentError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {paymentError}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelModal}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isPaying || !selectedStore?.product || productPrice <= 0}
                className="flex-1 bg-[#E53935] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isPaying ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
