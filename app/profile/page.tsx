"use client"

import * as React from "react"
import Image from "next/image"
import {
  Upload,
  X,
  ShieldCheck,
  ChevronDown,
  User,
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
          <div className="border-b border-[#efe6e4] px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/40">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#b62b38]">
              <User className="size-4 text-[#b62b38]" />
              <span>ข้อมูลโปรไฟล์ & จัดการบัญชี</span>
            </div>

            <div className="text-xs text-zinc-400">
              รหัสสมาชิก: <span className="font-mono font-semibold text-zinc-700">SPU-00428</span>
            </div>
          </div>

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
        </div>
      </main>
    </div>
  )
}