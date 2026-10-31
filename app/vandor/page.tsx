'use client';

import Sidebar from '@/components/ui/Sidebar';
import StatCard from '@/components/ui/StatCard';

export default function VendorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* แถบเมนูด้านซ้าย */}
      <Sidebar />

      {/* พื้นที่แสดงผลหลัก */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">สรุปข้อมูลร้านค้าและการทำรายการ</p>
          </div>
          <button className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition shadow-sm">
            + ถอนเงิน
          </button>
        </header>

        {/* ตารางแสดงการ์ดสถิติ (4 ช่อง) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="ยอดขายรวมวันนี้" value="3,480 T" highlight />
          <StatCard title="จำนวนรายการ" value="42" subtitle="รายการ" />
          <StatCard title="ถอนเงินสะสม" value="82.86 T" />
          <StatCard title="สถานะร้านค้า" value="3 / 4" subtitle="เปิดให้บริการ" />
        </div>

        {/* โครงสร้าง 2 คอลัมน์ (กราฟ & ประวัติการรับเงิน) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ฝั่งซ้าย: กราฟยอดขาย (lg:col-span-2) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-gray-400">ยอดขายรายวัน</p>
                <h3 className="text-xl font-bold text-gray-800">18,750 Token</h3>
              </div>
              <select className="text-xs border rounded-lg p-2 text-gray-500 outline-none">
                <option>7 วันล่าสุด</option>
                <option>30 วันล่าสุด</option>
              </select>
            </div>

            {/* แท่งกราฟจำลอง (Bar Chart Simulation) */}
            <div className="h-48 flex items-end justify-between gap-2 pt-8 px-2">
              {[40, 65, 30, 85, 95, 50, 75].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all ${
                      i === 4 ? 'bg-red-500' : 'bg-red-100 hover:bg-red-200'
                    }`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-400">วัน {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ฝั่งขวา: รายการล่าสุด */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">รายการล่าสุด</h3>
            <div className="space-y-4">
              {[
                { name: 'ชานมไข่มุก', time: '10:42 น.', amount: '+60 T' },
                { name: 'ข้าวผัดกะเพรา', time: '10:30 น.', amount: '+80 T' },
                { name: 'กาแฟเย็น', time: '09:15 น.', amount: '+55 T' },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}