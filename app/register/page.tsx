"use client"

import * as React from "react"
import Link from "next/link"
import {
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react"

interface RegisterPageProps {
  firstName: string
  lastName: string
  entryYear: string
  generation: string
  email: string
  phone: string
  address: string
  district: string
  province: string
  postalCode: string
  country: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export default function RegisterPage() {
  const [formData, setFormData] = React.useState<RegisterPageProps>({
    firstName: "",
    lastName: "",
    entryYear: "",
    generation: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    postalCode: "",
    country: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const isEmailValid =
    formData.email.length === 0 ||
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.agreeTerms) {
      alert("กรุณายินยอมรับข้อกำหนดการใช้งานก่อนลงทะเบียน")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน")
      return
    }
    alert(`ลงทะเบียนสำเร็จ: คุณ ${formData.firstName} ${formData.lastName}`)
  }

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] text-[#1e1e1e] flex flex-col justify-between font-sans antialiased">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mt-1">
            สมัครสมาชิก
          </h1>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#efe6e4] p-6 sm:p-10 shadow-sm">
          <p className="text-xs text-zinc-400 mb-6">ช่องที่มี * จำเป็นต้องกรอก</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ข้อมูลส่วนตัวและรุ่น</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    ชื่อ <span className="text-[#b62b38]">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    นามสกุล <span className="text-[#b62b38]">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    ปีที่เข้าเรียน (พ.ศ.) <span className="text-[#b62b38]">*</span>
                  </label>
                  <input
                    type="text"
                    name="entryYear"
                    required
                    value={formData.entryYear}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    รุ่น <span className="text-[#b62b38]">*</span>
                  </label>
                  <input
                    type="text"
                    name="generation"
                    required
                    value={formData.generation}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>
              </div>
            </section>

            <hr className="border-[#f0e8e6]" />

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ข้อมูลติดต่อ</h2>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      อีเมล <span className="text-[#b62b38]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none transition-all ${
                          !isEmailValid
                            ? "border-[#b62b38] ring-1 ring-[#b62b38]"
                            : "border-zinc-200 focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Mail className="size-4" />
                      </div>
                    </div>
                    {!isEmailValid && (
                      <p className="flex items-center gap-1 text-[11px] text-[#b62b38]">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      เบอร์โทรศัพท์ <span className="text-[#b62b38]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    ที่อยู่สำหรับติดต่อ / จัดส่ง <span className="text-[#b62b38]">*</span>
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      เขต / อำเภอ <span className="text-[#b62b38]">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      required
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      จังหวัด <span className="text-[#b62b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 appearance-none focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                      >
                        <option value="">-- เลือกจังหวัด --</option>
                        <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                        <option value="นนทบุรี">นนทบุรี</option>
                        <option value="ปทุมธานี">ปทุมธานี</option>
                        <option value="สมุทรปราการ">สมุทรปราการ</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                      <ChevronDown className="size-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      รหัสไปรษณีย์ <span className="text-[#b62b38]">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      ประเทศ <span className="text-[#b62b38]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 appearance-none focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                      >
                        <option value="">-- เลือกประเทศ --</option>
                        <option value="ไทย">ไทย</option>
                        <option value="ต่างประเทศ">ต่างประเทศ</option>
                      </select>
                      <ChevronDown className="size-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-[#f0e8e6]" />

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ตั้งรหัสผ่าน</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    รหัสผ่าน <span className="text-[#b62b38]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    ยืนยันรหัสผ่าน <span className="text-[#b62b38]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, agreeTerms: !prev.agreeTerms }))
                }
                className="flex items-start gap-2.5 select-none text-left group cursor-pointer"
              >
                <div
                  className={`size-4 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                    formData.agreeTerms
                      ? "bg-[#b62b38] border border-[#b62b38] text-white"
                      : "border border-zinc-300 bg-white group-hover:border-zinc-400"
                  }`}
                >
                  {formData.agreeTerms && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-xs text-zinc-600 leading-normal">
                  ยินยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว และยินยอมให้ใช้ข้อมูลเพื่อดำเนินการลงทะเบียน <span className="text-[#b62b38]">*</span>
                </span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#b62b38] text-white font-medium text-xs sm:text-sm shadow-sm hover:bg-[#9e2430] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRight className="size-4" />
              <span>สมัครสมาชิก</span>
            </button>

            <div className="text-center text-xs text-zinc-500 pt-1">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#b62b38] hover:underline transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
