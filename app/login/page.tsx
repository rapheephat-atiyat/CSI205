"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert(`เข้าสู่ระบบด้วย: ${email}`)
    }, 800)
  }

  return (
    <div className="relative min-h-screen w-full bg-[#fbfbfb] text-foreground flex flex-col justify-between selection:bg-brand/15 selection:text-brand">
      {/* Top navigation helper */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>กลับหน้าหลัก</span>
        </Link>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/60">
          tuatua platform
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[440px]">
          {/* Auth Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] p-6 sm:p-9 transition-all">
            
            {/* Header: Exact match to user's reference (Login & หน้าเข้าสู่ระบบ) */}
            <div className="border-b border-zinc-100 pb-5 mb-6">
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                  Login
                </h1>
                <span className="text-base sm:text-lg font-medium text-zinc-500">
                  หน้าเข้าสู่ระบบ
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                ยินดีต้อนรับกลับมา กรุณากรอกข้อมูลเพื่อเข้าใช้งานบัญชีของคุณ
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600"
                >
                  อีเมลหรือชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="size-4" />
                  </div>
                  <Input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 h-11 text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 hover:bg-white focus:bg-white border-zinc-200 transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-600"
                  >
                    รหัสผ่าน
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-zinc-500 hover:text-brand hover:underline transition-colors"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="size-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 hover:bg-white focus:bg-white border-zinc-200 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-zinc-300 text-brand accent-brand focus:ring-brand/20 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-600">จดจำการเข้าสู่ระบบไว้</span>
                </label>
              </div>

              {/* Submit Button (Uses web brand token) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-on-brand font-medium text-sm shadow-sm hover:bg-brand-hover active:scale-[0.99] transition-all duration-150 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-zinc-400 tracking-wider font-medium">
                  หรือเข้าสู่ระบบด้วย
                </span>
              </div>
            </div>

            {/* Social / External Login */}
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                className="w-full h-10 px-4 inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs cursor-pointer"
              >
                {/* Official Google G Logo */}
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วยบัญชี Google</span>
              </button>
            </div>

            {/* Footer / Register Link */}
            <div className="mt-7 text-center text-xs text-zinc-500">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              <Link
                href="/register"
                className="font-semibold text-brand hover:text-brand-hover hover:underline transition-colors"
              >
                สมัครสมาชิกใหม่
              </Link>
            </div>
          </div>

          {/* Privacy & Terms Note */}
          <p className="mt-5 text-center text-[11px] text-zinc-400">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
            <Link href="/terms" className="underline hover:text-zinc-600">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className="underline hover:text-zinc-600">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4 text-xs text-zinc-400">
        © {new Date().getFullYear()} tuatua. All rights reserved.
      </footer>
    </div>
  )
}
