"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

interface RegisterFormState {
  username: string
  firstName: string
  lastName: string
  phone: string
  graduationAt: string
  graduationInstitution: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<RegisterFormState>({
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    graduationAt: "",
    graduationInstitution: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const isEmailValid =
    formData.email.length === 0 ||
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)

  const isPhoneValid =
    formData.phone.length === 0 || /^\d{10}$/.test(formData.phone.replace(/\D/g, ""))

  const isPasswordMatch =
    formData.confirmPassword.length === 0 ||
    formData.password === formData.confirmPassword

  const isPasswordLongEnough =
    formData.password.length === 0 || formData.password.length >= 8

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errorMessage) setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("กรุณาระบุชื่อและนามสกุล")
      return
    }

    if (!isEmailValid) {
      setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน")
      return
    }

    if (formData.phone && !isPhoneValid) {
      setErrorMessage("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก")
      return
    }

    if (!formData.agreeTerms) {
      setErrorMessage("กรุณายินยอมรับข้อกำหนดการใช้งานก่อนลงทะเบียน")
      return
    }

    const cleanPhone = formData.phone
      ? formData.phone.replace(/\D/g, "")
      : undefined

    const parsedGraduationDate = formData.graduationAt
      ? new Date(formData.graduationAt)
      : undefined

    await authClient.signUp.email(
      {
        email: formData.email.trim(),
        password: formData.password,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim() || undefined,
        phone: cleanPhone || undefined,
        graduationAt: parsedGraduationDate,
        graduationInstitution: formData.graduationInstitution.trim() || undefined,
        callbackURL: "/login",
      },
      {
        onRequest: () => {
          setIsLoading(true)
        },
        onSuccess: () => {
          setIsLoading(false)
          setSuccessMessage("ลงทะเบียนสำเร็จแล้ว! กำลังนำท่านเข้าสู่ระบบ...")
          setTimeout(() => {
            router.push("/login")
          }, 1500)
        },
        onError: (ctx) => {
          setIsLoading(false)
          setErrorMessage(ctx.error.message || "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง")
        },
      }
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] text-[#1e1e1e] flex flex-col justify-between font-sans antialiased">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mt-1">
            สมัครสมาชิก
          </h1>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#efe6e4] p-6 sm:p-10 shadow-sm">
          <p className="text-xs text-zinc-400 mb-6">ช่องที่มี * จำเป็นต้องกรอก</p>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-[#b62b38] mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <div className="leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ข้อมูลส่วนตัว */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ข้อมูลส่วนตัว</h2>
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
                    ชื่อผู้ใช้ (Username)
                  </label>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    className={`w-full h-11 px-3.5 rounded-xl border bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none transition-all ${
                      !isPhoneValid
                        ? "border-[#b62b38] ring-1 ring-[#b62b38]"
                        : "border-zinc-200 focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15"
                    }`}
                  />
                  {!isPhoneValid && (
                    <p className="flex items-center gap-1 text-[11px] text-[#b62b38]">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก</span>
                    </p>
                  )}
                </div>
              </div>
            </section>

            <hr className="border-[#f0e8e6]" />

            {/* ข้อมูลการศึกษา */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ข้อมูลการศึกษา</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    สถาบันการศึกษา
                  </label>
                  <input
                    type="text"
                    name="graduationInstitution"
                    value={formData.graduationInstitution}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    วันที่ / ปีที่จบการศึกษา
                  </label>
                  <input
                    type="date"
                    name="graduationAt"
                    value={formData.graduationAt}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
                  />
                </div>
              </div>
            </section>

            <hr className="border-[#f0e8e6]" />

            {/* ข้อมูลติดต่อและรหัสผ่าน */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">ข้อมูลบัญชีและการเข้าสู่ระบบ</h2>
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    อีเมล <span className="text-[#b62b38]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      รหัสผ่าน <span className="text-[#b62b38]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none transition-all ${
                          !isPasswordLongEnough
                            ? "border-[#b62b38] ring-1 ring-[#b62b38]"
                            : "border-zinc-200 focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                        aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {!isPasswordLongEnough && (
                      <p className="flex items-center gap-1 text-[11px] text-[#b62b38]">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</span>
                      </p>
                    )}
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
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none transition-all ${
                          !isPasswordMatch
                            ? "border-[#b62b38] ring-1 ring-[#b62b38]"
                            : "border-zinc-200 focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                        aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {!isPasswordMatch && (
                      <p className="flex items-center gap-1 text-[11px] text-[#b62b38]">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>รหัสผ่านไม่ตรงกัน</span>
                      </p>
                    )}
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
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#b62b38] text-white font-medium text-xs sm:text-sm shadow-sm hover:bg-[#9e2430] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>กำลังลงทะเบียน...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="size-4" />
                  <span>สมัครสมาชิก</span>
                </>
              )}
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
