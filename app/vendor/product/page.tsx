"use client";

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Package, 
  QrCode, 
  HelpCircle, 
  Bell, 
  ChevronDown, 
  X 
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
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex font-sans text-slate-800">
      <main className="flex-1 flex flex-col min-w-0">


        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between text-xs text-slate-500">
         
          <div className="flex items-center gap-2">
            <span>Vendor workspace</span>
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



            </div>

            <div className="flex items-center justify-between mb-4">


            </div>
          </div>

       

        </div>

</main>


    </div>
  );
}

