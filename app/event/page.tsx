"use client"

import * as React from "react"
import Link from "next/link"
import {
  Ticket,
  Check,
  ArrowRight,
  Info,
  ExternalLink,
  Plus,
  Minus,
} from "lucide-react"

export default function EventDetailPage() {
  const [ticketCount, setTicketCount] = React.useState(1)
  const ticketPrice = 1200

  const handleIncrement = () => {
    if (ticketCount < 10) setTicketCount((prev) => prev + 1)
  }

  const handleDecrement = () => {
    if (ticketCount > 1) setTicketCount((prev) => prev - 1)
  }

  const handleCheckout = () => {
    alert(`กำลังนำคุณสู่ขั้นตอนชำระเงิน: บัตรร่วมงาน ${ticketCount} ใบ รวมเป็นเงิน ${(ticketCount * ticketPrice).toLocaleString()} บาท`)
  }

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] text-[#1e1e1e] flex flex-col justify-between font-sans antialiased selection:bg-[#b62b38]/15 selection:text-[#b62b38]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#b62b38] tracking-wide">
              กิจกรรมศิษย์เก่า
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mt-1">
              งานคืนสู่เหย้า ศรีปทุม ๒๕๖๙
            </h1>
           
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fde8ea] text-[#b62b38] border border-[#f5d0d4]">
              <Ticket className="size-3.5 text-[#b62b38]" />
              <span>เปิดจำหน่ายบัตร</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#efe6e4] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <section className="space-y-2.5">
                <h2 className="text-base font-bold text-zinc-900">
                  เกี่ยวกับงาน
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  สมาคมศิษย์เก่ามหาวิทยาลัยศรีปทุม ขอเชิญชวนศิษย์เก่าทุกรุ่นร่วมงานคืนสู่เหย้าประจำปี ๒๕๖๙ พบปะคณาจารย์และเพื่อนร่วมรุ่น รับประทานอาหารค่ำร่วมกัน พร้อมกิจกรรมบนเวทีและของที่ระลึกประจำรุ่น
                </p>
              </section>

              <hr className="border-[#f0e8e6]" />

              <section className="space-y-3">
                <h2 className="text-base font-bold text-zinc-900">
                  กำหนดการ
                </h2>
                <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white overflow-hidden px-5 py-1 text-xs">
                  <div className="py-3 flex items-start gap-4">
                    <span className="font-bold text-[#b62b38] w-14 shrink-0 font-mono">17:00</span>
                    <div>
                      <p className="font-semibold text-zinc-900">ลงทะเบียนและรับของที่ระลึก</p>
                      <p className="text-zinc-400 mt-0.5">แสดง QR Code จากหน้าโปรไฟล์ที่จุดลงทะเบียน</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-4">
                    <span className="font-bold text-[#b62b38] w-14 shrink-0 font-mono">18:00</span>
                    <div>
                      <p className="font-semibold text-zinc-900">เปิดงานและพบปะคณาจารย์</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-4">
                    <span className="font-bold text-[#b62b38] w-14 shrink-0 font-mono">18:30</span>
                    <div>
                      <p className="font-semibold text-zinc-900">รับประทานอาหารค่ำร่วมกัน</p>
                      <p className="text-zinc-400 mt-0.5">โต๊ะอาหารแบบแชร์ จัดตามรุ่นและคณะ</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-4">
                    <span className="font-bold text-[#b62b38] w-14 shrink-0 font-mono">20:00</span>
                    <div>
                      <p className="font-semibold text-zinc-900">การแสดงดนตรีและกิจกรรมบนเวที</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-4">
                    <span className="font-bold text-[#b62b38] w-14 shrink-0 font-mono">22:00</span>
                    <div>
                      <p className="font-semibold text-zinc-900">ปิดงาน</p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-[#f0e8e6]" />

              <section className="space-y-3">
                <h2 className="text-base font-bold text-zinc-900">
                  สถานที่และการเดินทาง
                </h2>
                <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2 text-xs">
                  <p className="font-semibold text-zinc-900">
                    ลานจามจุรี มหาวิทยาลัยศรีปทุม (วิทยาเขตบางเขน)
                  </p>
                  <p className="text-zinc-600">
                    2410/2 ถนนพหลโยธิน แขวงเสนานิคม เขตจตุจักร กรุงเทพมหานคร 10900
                  </p>
                  <p className="text-zinc-500 pt-1">
                    รถไฟฟ้า BTS สถานีบางบัว (ทางออก 1) · มีที่จอดรถภายในมหาวิทยาลัย
                  </p>
                  <div className="pt-2">
                    <Link
                      href="https://maps.google.com/?q=Sripatum+University"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b62b38] hover:underline"
                    >
                      <span>ดูใน Google Maps</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
              <div className="border border-zinc-200 rounded-2xl bg-white p-6 shadow-xs sticky top-8 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      บัตรร่วมงาน
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      รวมอาหาร เครื่องดื่ม และของที่ระลึก
                    </p>
                  </div>
                  <div className="size-8 rounded-lg bg-[#fde8ea] text-[#b62b38] flex items-center justify-center">
                    <Ticket className="size-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                    {ticketPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">บาท / ท่าน</span>
                </div>

                <div className="space-y-2 border-t border-b border-zinc-100 py-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                    <span>จำนวนบัตร</span>
                    <span>ยอดรวม</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={ticketCount <= 1}
                        className="size-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center text-xs font-semibold text-zinc-900">
                        {ticketCount}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={ticketCount >= 10}
                        className="size-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <div className="text-base font-bold text-zinc-900">
                      {(ticketCount * ticketPrice).toLocaleString()} บาท
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>อาหารบุฟเฟต์และเครื่องดื่มตลอดงาน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>ของที่ระลึกประจำรุ่น</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>QR Code บันทึกในโปรไฟล์ทันที</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full h-11 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="size-4" />
                  <span>ซื้อบัตรร่วมงาน</span>
                </button>

                <div className="bg-[#f7f7f8] rounded-xl p-3 border border-zinc-200/60 flex items-start gap-2">
                  <Info className="size-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    บัตรจะบันทึกลงในหน้าโปรไฟล์ของคุณทันที ไม่ต้องพิมพ์บัตรกระดาษ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}