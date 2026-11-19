"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

function getDestination() {
  const next = new URLSearchParams(window.location.search).get("next")
  if (!next?.startsWith("/")) return "/"
  try {
    const url = new URL(next, window.location.origin)
    return url.origin === window.location.origin && !url.pathname.startsWith("//")
      ? url.pathname + url.search + url.hash
      : "/"
  } catch {
    return "/"
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const destination = getDestination()

    await authClient.signIn.email(
      {
        email: email.trim(),
        password,
        rememberMe,
        callbackURL: destination,
      },
      {
        onRequest: () => {
          setIsLoading(true)
        },
        onSuccess: () => {
          setIsLoading(false)
          router.push(destination)
          router.refresh()
        },
        onError: (ctx) => {
          setIsLoading(false)
          setErrorMessage(ctx.error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        },
      }
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#efe6e4] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.06)] p-7 sm:p-9 transition-all">
        <div className="mb-2">
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#fde8ea] text-[#b62b38] tracking-tight">
            ยินดีต้อนรับกลับ
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-2">
          เข้าสู่ระบบ
        </h1>
        <p className="text-xs sm:text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
          เข้าสู่ระบบเพื่อจัดการข้อมูลสมาชิกและดูบัตรของคุณ
        </p>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 text-[#b62b38] mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-700"
            >
              อีเมล <span className="text-[#b62b38]">*</span>
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="name@example.com"
                className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="size-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-700"
            >
              รหัสผ่าน <span className="text-[#b62b38]">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="กรอกรหัสผ่านของคุณ"
                className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#b62b38] focus:ring-2 focus:ring-[#b62b38]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
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

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 select-none group text-left cursor-pointer"
            >
              <div
                className={`size-4 rounded flex items-center justify-center transition-colors ${
                  rememberMe
                    ? "bg-[#b62b38] border border-[#b62b38] text-white"
                    : "border border-zinc-300 bg-white group-hover:border-zinc-400"
                }`}
              >
                {rememberMe && <Check className="size-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-zinc-600 group-hover:text-zinc-800 transition-colors">
                จดจำการเข้าสู่ระบบ
              </span>
            </button>

            <Link
              href="/forgot-password"
              className="text-xs text-[#b62b38] hover:underline transition-colors"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#b62b38] text-white font-medium text-xs sm:text-sm shadow-sm hover:bg-[#9e2430] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </div>
            ) : (
              <>
                <ArrowRight className="size-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-zinc-500">
          ยังไม่มีบัญชีสมาชิก?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#b62b38] hover:underline transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>

        <div className="mt-4 pt-3 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="size-3.5 text-zinc-400" />
          <span>ข้อมูลของคุณได้รับการดูแลอย่างปลอดภัย</span>
        </div>
      </div>
    </div>
  )
}
