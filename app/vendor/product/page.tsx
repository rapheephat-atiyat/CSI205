"use client";

import React, { useState } from 'react';
import {
  LayoutGrid,
  Package,
  QrCode,
  HelpCircle,
  Bell,
  ChevronDown,
  X,
  Search,
  Plus,
} from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  price: number;
  category: string;
  imageUrl: string;
}



export default function ProductManagement() {

  const [price, setPrice] = useState<number>(65);
  const [inputPrice, setInputPrice] = useState<number>(65);
  const handleSave = () => {
    setPrice(inputPrice);
  };
  const [inputName, setInputName] = useState<string>("กาแฟอเมริกาโน่เย็น");

  return (


    <div className="min-h-screen bg-[#F4F5F7] flex font-sans text-slate-800">
      <main className="flex-1 flex flex-col min-w-0">


        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between text-xs text-slate-500">

          <div className="flex items-center gap-2">
            <span>Vendor Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Product Management</span>
          </div>


          <div className="flex items-center gap-4">
            <span>21 ต.ค. 2569</span>
            <Bell className="w-4 h-4 text-slate-400 cursor-pointer" />
            <div className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700">
              <span>TH</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </header>


        <div className="p-8 flex-1 flex gap-6 overflow-x-auto">


          <div className="flex-1 min-w-[500px]">


            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
              <p className="text-xs text-slate-400 mt-1">แก้ไขรายละเอียดและราคา Token ของสินค้า</p>
            </div>


            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-800">รายการสินค้า</h2>
                <p className="text-xs text-slate-400">Good Day Café · ราคาแสดงเป็น Token</p>
              </div>


              <div className="grid grid-cols-12 text-xs font-medium text-slate-400 pb-3 px-4 border-b border-slate-100">
                <div className="col-span-6">สินค้า</div>
                <div className="col-span-3 text-center">ราคา</div>
                <div className="col-span-3 text-center">สถานะ</div>
              </div>


              {/* ช่องรายการสินค้า */}
              <div className="grid grid-cols-12 items-center p-3 mt-2 rounded-xl bg-[#FFF0F2] border border-transparent cursor-pointer">

                {/* ช่องที่ 1: รูป + ชื่อสินค้า (กินพื้นที่ 6 จาก 12 ช่อง) */}
                <div className="col-span-6 flex items-center gap-3">

                  <img
                    src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=150"
                    alt="กาแฟอเมริกาโน่เย็น"
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">กาแฟอเมริกาโน่เย็น</p>
                    <p className="text-[11px] text-slate-400">P-001 · Iced Americano</p>
                  </div>
                </div>

                {/* ช่องที่ 2ช่องโทเค้นของสินค้า */}
                <div className="col-span-3 text-center font-bold text-slate-800 text-sm">
                  65 T
                </div>

                {/* ช่องที่ 3: ป้ายสถานะที่เขียนว่าพร้อมขาย*/}
                <div className="col-span-3 flex justify-center">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    พร้อมขาย
                  </span>
                </div>

              </div>


            </div>

          </div>


          {/* กรอบข้อความ ด้านขวา: ฟอร์มแก้ไขสินค้า */}
          <div className="w-[340px] bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm h-fit shrink-0">

            {/* 1. ส่วนหัวข้อฟอร์ม + ปุ่มปิด */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">รายละเอียดสินค้า</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. รูปภาพสินค้า */}
            <div className="mb-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-100" />

            </div>

            {/* 3. กลุ่มช่องกรอกข้อมูล */}
            <div className="space-y-4">

              {/* ชื่อของสินค้าด้านขวา */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสินค้า *
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                />


                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมวดหมู่
                  </label>
                  <div className="relative">
                    <select
                      defaultValue="น้ำดื่ม"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm appearance-none bg-white text-slate-700 focus:outline-none focus:border-slate-400"
                    >
                      <option value="น้ำดื่ม">น้ำดื่ม</option>
                      <option value="อาหาร">อาหาร</option>
                      <option value="ขนมหวาน">ขนมหวาน</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>


                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคา (Token) *
                  </label>

                  <input
                    type="number"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                  />
                  {/* ปุ่มยืนยันการแก้ไข */}
                  <button
                    onClick={handleSave}
                    className="w-full mt-6 bg-[#E52E40] hover:bg-[#d02536] text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    บันทึกการเปลี่ยนแปลง
                  </button>


                  {/* เปืดปิดสินค้า */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">เปิดขายสินค้า</p>
                      <p className="text-[10px] text-slate-400">แสดงในหน้าสแกนรับชำระ</p>
                    </div>

                    <button className="w-11 h-6 rounded-full bg-[#E52E40] relative p-0.5 transition-colors">
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm translate-x-5 transition-transform" />
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

