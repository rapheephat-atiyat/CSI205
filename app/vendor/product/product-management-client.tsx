"use client";

import React, { useState } from "react";
import { useVendorStore } from "@/components/vendor/vendor-store-context";
import {
  Bell,
  ChevronDown,
  Package,
} from "lucide-react";

export function ProductManagementClient() {
  const { selectedStore } = useVendorStore();
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const storeName = selectedStore?.name ?? "Good Day Café";
  const product = selectedStore?.product;

  const name = product?.title ?? "กาแฟอเมริกาโน่เย็น";
  const price = Number(product?.price ?? 65);
  const productImage = selectedStore?.productImage;
  const productSubtitle =
    product?.description ||
    (product ? `รหัสสินค้า · ${product.id.slice(0, 6).toUpperCase()}` : "P-001 · Iced Americano");

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex font-sans text-slate-800">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Vendor Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Product Management</span>
          </div>

          {/* <div className="flex items-center gap-4">
            <span>21 ต.ค. 2569</span>
            <Bell className="w-4 h-4 text-slate-400 cursor-pointer" />
            <div className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700">
              <span>TH</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div> */}
        </header>

        <div className="p-8 flex-1 flex gap-6 overflow-x-auto">
          <div className="flex-1 min-w-[500px]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
              <p className="text-xs text-slate-400 mt-1">รายละเอียดและราคา Token ของสินค้า</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-800">รายการสินค้า</h2>
                <p className="text-xs text-slate-400">{storeName} · ราคาแสดงเป็น Token</p>
              </div>

              <div className="grid grid-cols-12 text-xs font-medium text-slate-400 pb-3 px-4 border-b border-slate-100">
                <div className="col-span-6">สินค้า</div>
                <div className="col-span-3 text-center">ราคา</div>
                <div className="col-span-3 text-center">สถานะ</div>
              </div>

              {/* ช่องรายการสินค้า */}
              <div className="grid grid-cols-12 items-center p-3 mt-2 rounded-xl bg-[#FFF0F2] border border-transparent">
                {/* ช่องที่ 1: รูป + ชื่อสินค้า */}
                <div className="col-span-6 flex items-center gap-3">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{name}</p>
                    <p className="text-[11px] text-slate-400">{productSubtitle}</p>
                  </div>
                </div>

                {/* ช่องที่ 2: ราคาโทเค็นของสินค้า */}
                <div className="col-span-3 text-center font-bold text-slate-800 text-sm">
                  {price.toLocaleString()} T
                </div>

                {/* ช่องที่ 3: ป้ายสถานะ */}
                <div className="col-span-3 flex justify-center">
                  {isAvailable ? (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      พร้อมขาย
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ปิดชั่วคราว
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* กรอบข้อความ ด้านขวา: รายละเอียดสินค้า */}
          <div className="w-[340px] bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm h-fit shrink-0">
            {/* 1. ส่วนหัวข้อ */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">รายละเอียดสินค้า</h3>
            </div>

            {/* 2. รูปภาพสินค้า */}
            <div className="mb-4">
              {productImage ? (
                <img
                  src={productImage}
                  alt={name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400">
                  <Package className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* 3. กลุ่มข้อมูล (Read-only ยกเว้นสวิตช์เปิด-ปิด) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  value={name}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />

                {/* <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมวดหมู่
                  </label>
                  <input
                    type="text"
                    value="น้ำดื่ม"
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div> */}

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคา (Token) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />

                  {/* สวิตช์เปิดปิดสินค้า (กดสลับได้) */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">เปิดขายสินค้า</p>
                      <p className="text-[10px] text-slate-400">แสดงในหน้าสแกนรับชำระ</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAvailable(!isAvailable)}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                        isAvailable ? "bg-[#E52E40]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          isAvailable ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}