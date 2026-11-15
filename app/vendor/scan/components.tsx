"use client";

import { useState } from "react";

export function ScannerBox() {
  // 1. ต้องประกาศตัวแปร State ก่อนคำสั่ง return เสมอ
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // 2. จากนั้นค่อย return โครงสร้าง HTML (JSX) ออกไป
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">สแกน QR เพื่อรับชำระ</h2>
        
        {/* ปุ่มปิดกล้อง (จะโชว์ก็ต่อเมื่อกล้องเปิดอยู่เท่านั้น) */}
        {isCameraOpen && (
          <button 
            onClick={() => setIsCameraOpen(false)}
            className="text-sm text-gray-500 hover:text-red-500 font-bold underline"
          >
            ปิดกล้อง
          </button>
        )}
      </div>
      
      {/* ใช้เงื่อนไข (Ternary Operator) เพื่อสลับหน้าจอ */}
      {!isCameraOpen ? (
        
        // ยังไม่ได้เปิดกล้อง โชว์ปุ่ม
        <div className="w-full h-[400px] bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">คลิกปุ่มด้านล่างเพื่อสแกน QR Code</p>
          <button 
            onClick={() => setIsCameraOpen(true)} // พอกดปุ่มนี้ สวิตช์จะเปลี่ยนเป็น true
            className="bg-[#E53935] hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            เปิดกล้องสแกน
          </button>
        </div>

      ) : (

        //  กดปุ่มเปิดกล้องแล้วโชว์กรอบดำและเส้นสีแดง
        <div className="relative w-full h-[400px] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
          {/* กรอบแดง */}
          <div className="relative z-10 w-64 h-64 border-2 border-red-500 rounded-2xl">
            {/* ป้ายด้านล่างกรอบแดง */}
            <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md w-max">
              <span className="text-gray-500 font-bold text-sm">รอกล้องทำงาน...</span>
            </div>
          </div>
        </div>

      )}
      
    </div>
  );
}

export function PaymentSummary() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mt-5">
      <h2 className="text-lg font-bold text-gray-900 mb-6">สรุปยอดชำระ</h2>
      
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-gray-500">ยอดรับชำระทั้งหมด</span>
        <span className="text-xl font-bold text-red-600">70 Token</span>
      </div>

      <button className="w-full bg-[#E53935] hover:bg-red-700 text-white py-3.5 rounded-xl text-sm font-bold transition-colors">
        ยืนยันรับชำระ 70 Token
      </button>
    </div>
  );
}