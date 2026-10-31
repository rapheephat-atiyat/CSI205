import { PageHeader } from "@/components/staff/page-header";
import { ScanResultCard } from "@/components/staff/scan-result";
import type { ScanOutcome } from "@/lib/staff-mock";

const cases: { outcome: ScanOutcome; name?: string; ticketId: string; hint: string }[] = [
  { outcome: "checked-in", name: "ธนกร วงศ์สกุล", ticketId: "TT-000124", hint: "สแกนผ่าน — ปล่อยเข้างานได้ทันที" },
  { outcome: "expired", ticketId: "TT-000007", hint: "QR ใช้ได้ช่วงเวลาสั้น ๆ ให้ผู้เข้าร่วมรีเฟรช QR ในแอป" },
  { outcome: "duplicate", name: "อรอุมา เจริญผล", ticketId: "TT-000127", hint: "สแกนซ้ำภายในเวลาสั้น ๆ ไม่ต้องดำเนินการเพิ่ม" },
  { outcome: "invalid", ticketId: "TT-999001", hint: "ไม่พบในระบบ — ให้ลองค้นหาด้วยชื่อ หรือเรียกหัวหน้างาน" },
];

export default function ScanValidationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scan Validation"
        title="ข้อความแจ้งเตือนการสแกน"
        description="รูปแบบข้อความที่เจ้าหน้าที่จะเห็นเมื่อ QR หมดอายุ สแกนซ้ำ หรือบัตรไม่ถูกต้อง"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((c) => (
          <div key={c.outcome}>
            <ScanResultCard outcome={c.outcome} name={c.name} ticketId={c.ticketId} />
            <p className="mt-2 px-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>
    </>
  );
}
