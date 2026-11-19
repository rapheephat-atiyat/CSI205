"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useVendorStore } from "@/components/vendor/vendor-store-context";
import { Camera, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

export function ScannerBox() {
  const { selectedStore } = useVendorStore();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const storeName = selectedStore?.name ?? "ร้านค้า";
  const productTitle = selectedStore?.product?.title ?? "สินค้าของร้าน";
  const productPrice = Number(selectedStore?.product?.price ?? 0);

  const stopCamera = async () => {
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
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleOpenCamera = async () => {
    setScannedResult(null);
    setCameraError(null);
    setIsPaid(false);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "เบราว์เซอร์บล็อกการใช้งานกล้อง กรุณาเปิดเว็บผ่าน http://localhost:3000 หรือ HTTPS เท่านั้น"
      );
      return;
    }

    setIsCameraOpen(true);

    requestAnimationFrame(async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setCameraError("ไม่พบอุปกรณ์กล้องบนเครื่องนี้ (No camera device found)");
          setIsCameraOpen(false);
          return;
        }

        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("environment")
        );
        const cameraId = backCamera ? backCamera.id : devices[0].id;

        const html5QrCode = new Html5Qrcode("vendor-qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          (decodedText) => {
            setScannedResult(decodedText);
            stopCamera();
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera start error:", err);
        const rawMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);

        if (rawMsg.includes("NotAllowedError") || rawMsg.includes("Permission")) {
          setCameraError(
            "คุณยังไม่ได้อนุญาตให้ใช้กล้อง — กดที่ไอคอนรูปกุญแจหรือกล้องตรงแถบ URL ด้านบน แล้วเลือก 'อนุญาต (Allow)'"
          );
        } else if (rawMsg.includes("NotFoundError")) {
          setCameraError("ไม่พบกล้องบนอุปกรณ์นี้ (NotFoundError: ต่อเว็บแคมหรือเปิดบนมือถือ)");
        } else if (rawMsg.includes("NotReadableError") || rawMsg.includes("in use")) {
          setCameraError(
            "กล้องกำลังถูกใช้งานโดยโปรแกรมหรือแท็บอื่นอยู่ กรุณาปิดโปรแกรมอื่นที่ใช้กล้องก่อน"
          );
        } else {
          setCameraError(`ไม่สามารถเปิดกล้องได้ (${rawMsg})`);
        }
        setIsCameraOpen(false);
      }
    });
  };

  const handleConfirmPayment = () => {
    // TODO: เชื่อมต่อ API / Server Action ตัด Token จาก scannedResult เข้า selectedStore
    setIsPaid(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      {/* ส่วนหัว: แสดงเฉพาะชื่อหน้า ไม่แสดงราคาจนกว่าจะสแกน */}
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

      {/* แจ้งเตือนหากเปิดกล้องไม่สำเร็จ */}
      {cameraError && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* พื้นที่แสดงกล้อง / ผลลัพธ์หลังสแกนเพื่อหักราคา / ปุ่มเปิดกล้อง */}
      {isCameraOpen ? (
        <div className="relative w-full bg-gray-950 rounded-xl overflow-hidden flex flex-col items-center justify-center p-2">
          <div id="vendor-qr-reader" className="w-full max-w-[420px] overflow-hidden rounded-lg" />
          <p className="text-xs text-white/80 py-2.5">
            นำ QR Code ของลูกค้ามาวางให้อยู่ในกรอบสี่เหลี่ยม
          </p>
        </div>
      ) : scannedResult ? (
        <div className="w-full bg-slate-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center gap-4">
          {isPaid ? (
            <>
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">รับชำระเงินสำเร็จ!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  หักยอด <span className="font-bold text-emerald-600">{productPrice.toLocaleString()} Token</span> เรียบร้อยแล้ว
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCamera}
                className="mt-2 inline-flex items-center gap-2 bg-[#E53935] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                สแกนรายการถัดไป
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-[#E53935]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">พบข้อมูล QR Code ลูกค้า</h3>
                <p className="text-xs text-gray-500 mt-0.5">ตรวจสอบรายการและกดยืนยันเพื่อหัก Token</p>
              </div>

              {/* กล่องสรุปรายการและราคาที่จะหัก (โผล่หลังสแกนเท่านั้น) */}
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-4 text-left space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">ร้านค้า</span>
                  <span className="font-semibold text-gray-800">{storeName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">รายการสินค้า</span>
                  <span className="font-semibold text-gray-800">{productTitle}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">รหัสผู้ชำระ (QR)</span>
                  <span className="font-mono text-gray-700 truncate max-w-[200px]">
                    {scannedResult}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">ยอดที่ต้องหัก</span>
                  <span className="text-lg font-bold text-[#E53935]">
                    {productPrice.toLocaleString()} Token
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  สแกนใหม่
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex-2 bg-[#E53935] hover:bg-red-700 text-white py-2.5 px-5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
                >
                  ยืนยันหัก {productPrice.toLocaleString()} Token
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full h-[380px] bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-4 p-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <Camera className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-sm">พร้อมรับชำระด้วย QR Code</p>
            <p className="text-gray-400 text-xs mt-1">คลิกปุ่มด้านล่างเพื่อเปิดกล้องสแกน</p>
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
  );
}