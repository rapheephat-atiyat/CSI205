"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  X,
  Ticket,
  Wallet,
  ShieldCheck,
  Check,
  Download,
  Info,
  ChevronDown,
  User,
  Plus,
} from "lucide-react"

interface ProfileFormState {
  username: string
  firstName: string
  nickname: string
  role: string
  lastName: string
  displayName: string
  email: string
  phone: string
  website: string
  lineId: string
  bio: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "ticket" | "tokens">("profile")
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>("/images/avatar-default.svg")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [formData, setFormData] = React.useState<ProfileFormState>({
    username: "gene.rodrig",
    firstName: "เต",
    nickname: "พี่เต",
    role: "ศิษย์เก่า (Alumni)",
    lastName: "วรกร",
    displayName: "พี่เต วรกร",
    email: "tae.waragon@spumail.net",
    phone: "081 234 5678",
    website: "https://spu.ac.th",
    lineId: "@tae_spu",
    bio: "ศิษย์เก่าคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยศรีปทุม รุ่น 42 ยินดีที่ได้กลับมาพบเพื่อนๆ ทุกคนในงานคืนสู่เหย้าครับ",
  })

  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarUrl(url)
    }
  }

  const handleRemovePhoto = () => {
    setAvatarUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    alert("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว")
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) {
      alert("กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่")
      return
    }
    alert("เปลี่ยนรหัสผ่านสำเร็จ")
    setOldPassword("")
    setNewPassword("")
  }

  const handleDownloadQR = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    alert("บันทึกบัตร QR เข้างานเรียบร้อยแล้ว")
  }

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] text-[#1e1e1e] flex flex-col justify-between font-sans antialiased selection:bg-[#b62b38]/15 selection:text-[#b62b38]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#b62b38] tracking-wide">
            
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mt-1">
              โปรไฟล์ของฉัน
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
             
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              <ShieldCheck className="size-3.5 text-[#059669]" />
              <span>สมาชิกที่ยืนยันแล้ว</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#efe6e4] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="border-b border-[#efe6e4] px-6 sm:px-8 pt-4 pb-0 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/40">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "border-[#b62b38] text-[#b62b38]"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <User className="size-4" />
                <span>ข้อมูลโปรไฟล์ & จัดการบัญชี</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ticket")}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "ticket"
                    ? "border-[#b62b38] text-[#b62b38]"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Ticket className="size-4" />
                <span>บัตรเข้างานของฉัน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tokens")}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "tokens"
                    ? "border-[#b62b38] text-[#b62b38]"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Wallet className="size-4" />
                <span>โทเคน (500)</span>
              </button>
            </div>

            <div className="text-xs text-zinc-400 pb-2">
              รหัสสมาชิก: <span className="font-mono font-semibold text-zinc-700">SPU-00428</span>
            </div>
          </div>

          {activeTab === "profile" && (
            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                      Account Management
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="relative w-full aspect-[4/4.5] max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-[#f8ded4] border border-[#efe6e4] flex items-center justify-center shadow-xs">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile Avatar"
                          fill
                          sizes="(max-width: 768px) 100vw, 280px"
                          className="object-cover object-center"
                          unoptimized
                        />
                      ) : (
                        <div className="size-24 rounded-full bg-[#fde8ea] text-[#b62b38] font-bold text-3xl flex items-center justify-center">
                          เต
                        </div>
                      )}

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-3 right-3 size-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Remove photo"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-[280px] mx-auto h-11 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                    >
                      <Upload className="size-4 text-zinc-500" />
                      <span>อัปโหลดรูปภาพ</span>
                    </button>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-[#efe6e4]">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                    >
                      Change Password
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-8 space-y-8">
                  <form onSubmit={handleSaveProfile} className="space-y-8">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-4">
                        Profile Information
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Nickname
                          </label>
                          <input
                            type="text"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Role
                          </label>
                          <div className="relative">
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full h-11 px-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 appearance-none focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                            >
                              <option value="ศิษย์เก่า (Alumni)">ศิษย์เก่า (Alumni)</option>
                              <option value="อาจารย์ / บุคลากร">อาจารย์ / บุคลากร</option>
                              <option value="ศิษย์ปัจจุบัน">ศิษย์ปัจจุบัน</option>
                              <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin)</option>
                            </select>
                            <ChevronDown className="size-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Display Name Publicly as
                          </label>
                          <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-4">
                        Contact Info
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Email (required)
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            WhatsApp / เบอร์โทรศัพท์
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Website
                          </label>
                          <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Telegram / Line ID
                          </label>
                          <input
                            type="text"
                            name="lineId"
                            value={formData.lineId}
                            onChange={handleInputChange}
                            className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-4">
                        About the User
                      </h2>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Biographical Info
                        </label>
                        <textarea
                          name="bio"
                          rows={4}
                          value={formData.bio}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all resize-y"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#efe6e4]">
                      <button
                        type="button"
                        onClick={() => alert("ยกเลิกการเปลี่ยนแปลง")}
                        className="px-5 h-11 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 transition-all cursor-pointer shadow-2xs"
                      >
                        ยกเลิก
                      </button>

                      <button
                        type="submit"
                        className="px-6 h-11 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                      >
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ticket" && (
            <div className="p-6 sm:p-10 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-[#efe6e4] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#f0e8e6] pb-4">
                  <h3 className="text-base font-bold text-zinc-900">
                    บัตรเข้างานของฉัน
                  </h3>
                  <Ticket className="size-4 text-[#b62b38]" />
                </div>

                <div className="mt-4">
                  <h4 className="text-base font-bold text-zinc-900">
                    คืนสู่เหย้า ศรีปทุม ๒๕๖๙
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    19 ธ.ค. 2569 · 17:00-22:00 น.
                  </p>
                  <p className="text-xs text-zinc-400">
                    มหาวิทยาลัยศรีปทุม · กรุงเทพฯ
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                    <Check className="size-3" />
                    <span>ชำระเงินแล้ว</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                    ยังไม่เช็คอิน
                  </span>
                </div>

                <div className="my-6 flex flex-col items-center justify-center p-4 bg-zinc-50/70 rounded-2xl border border-zinc-100">
                  <div className="relative size-44 sm:size-48 bg-white p-3 rounded-xl shadow-xs border border-zinc-200/80 flex items-center justify-center">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-zinc-900"
                      fill="currentColor"
                    >
                      <path d="M0 0h30v30H0zM5 5v20h20V5H5zM10 10h10v10H10z" />
                      <path d="M70 0h30v30H70zM75 5v20h20V5H75zM80 10h10v10H80z" />
                      <path d="M0 70h30v30H0zM5 75v20h20V75H5zM10 80h10v10H10z" />
                      <path d="M35 5h5v5h-5zM45 5h10v5h-10zM60 5h5v5h-5zM35 15h10v5h-10zM50 15h5v10h-5zM60 15h5v5h-5zM35 25h5v5h-5zM45 25h5v5h-5zM55 25h10v5h-10z" />
                      <path d="M5 35h5v5H5zM15 35h10v5H15zM35 35h5v5h-5zM45 35h5v5h-5zM55 35h10v5H55zM75 35h5v10h-5zM85 35h10v5H85z" />
                      <path d="M5 45h10v5H5zM20 45h5v10h-5zM35 45h10v5h-10zM50 45h5v5h-5zM60 45h10v5h-10zM85 45h10v5H85z" />
                      <path d="M5 55h5v5H5zM15 55h5v5h-5zM25 55h15v5H25zM45 55h10v5h-10zM65 55h5v5h-5zM75 55h10v5H75zM90 55h5v5h-5z" />
                      <path d="M5 65h10v5H5zM20 65h5v5h-5zM35 65h15v5h-15zM55 65h5v5h-5zM65 65h10v5h-10zM85 65h10v5H85z" />
                      <path d="M35 75h5v10h-5zM45 75h10v5h-10zM60 75h5v5h-5zM70 75h10v5H70zM85 75h5v5h-5zM95 75h5v5h-5z" />
                      <path d="M40 85h15v5h-15zM60 85h5v5h-5zM70 85h5v5h-5zM80 85h10v5H80z" />
                      <path d="M35 95h10v5h-10zM50 95h5v5h-5zM60 95h15v5h-15zM80 95h5v5h-5zM90 95h10v5H90z" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-zinc-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">ผู้ถือบัตร</span>
                    <span className="font-semibold text-zinc-900">{formData.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">ประเภท</span>
                    <span className="font-semibold text-zinc-900">บัตรร่วมงาน · 1 ที่นั่ง</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">ราคาบัตร</span>
                    <span className="font-semibold text-zinc-900">1,200 บาท</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">หมายเลขบัตร</span>
                    <span className="font-semibold text-zinc-900 font-mono">SPU69-00428</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="w-full h-11 mt-5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  <Download className="size-4 text-zinc-500" />
                  <span>{copied ? "บันทึกเรียบร้อย!" : "บันทึกบัตร / QR"}</span>
                </button>

                <div className="bg-[#f7f7f8] rounded-xl p-3.5 border border-zinc-200/60 mt-4 flex items-start gap-2.5">
                  <Info className="size-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-zinc-800">
                      ไม่ต้องรออีเมล ก็เข้างานได้
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                      เปิด QR จากหน้านี้ให้เจ้าหน้าที่สแกนได้เสมอ อีเมลเป็นเพียงช่องทางการส่งสำเนาเพิ่มเติม
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="p-6 sm:p-10 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-[#efe6e4] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-900">
                    โทเคนของฉัน
                  </h3>
                  <div className="size-8 rounded-lg bg-[#fde8ea] text-[#b62b38] flex items-center justify-center">
                    <Wallet className="size-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
                    500
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-zinc-400">
                    โทเคน
                  </span>
                </div>

            

                <div className="border-t border-[#f0e8e6] pt-4 mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Plus className="size-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">
                        เติมโทเคนครั้งล่าสุด
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        27 ต.ค. 2569 · 10:30 น.
                      </p>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-emerald-600 font-mono">
                    +500
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full border-t border-[#f0e8e6] bg-white/60 py-4 px-6 sm:px-10 mt-12 text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>© 2569 สมาคมศิษย์เก่ามหาวิทยาลัยศรีปทุม</div>
        <div className="flex items-center gap-2">
          <Link href="/contact" className="hover:text-zinc-800 transition-colors">
            ติดต่อเรา
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-zinc-800 transition-colors">
            นโยบายความเป็นส่วนตัว
          </Link>
        </div>
      </footer>
    </div>
  )
}