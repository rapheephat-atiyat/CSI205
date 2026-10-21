"use client";
import { usePathname } from "next/navigation";

type NAV_GROUPS = {
  lable: string;
  items: {
    href: string;
    lable: string;
  }[];
}[];

const NAV_GROUPS = [
  {
    lable: "ภาพรวม",
    items: [{ href: "/admin", lable: "Dashboard" }],
  },
  {
    lable: "ตั้งค่า",
    items: [
      { href: "/admin/setting/event", lable: "ตั้งค่างาน" },
      { href: "/admin/setting/pricing", lable: "ราคาบัตร/เสื้อ" },
      { href: "/admin/setting/tiken-rate", lable: "เรท Token" },
    ],
  },
  {
    lable: "จัดการข้อมูล",
    items: [
      { href: "/admin/manage/users", lable: "รายชื่อผู้ลงทะเบียน" },
      { href: "/admin/manage/vendors", lable: "รายการร้านค้า" },
      { href: "/admin/manage/permission", lable: "สิทธิ์ผู้ดูแล" },
    ],
  },
  {
    lable: "รายงาย",
    items: [
      { href: "/admin/reports/overview", lable: "รายงานภาพรวม" },
      { href: "/admin/reports/audit-log", lable: "ประวัติแก้ไข" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="พื้นที่ผู้ดูแลระบบ" className="space-y-6">
      {NAV_GROUPS.map((group) => {
        return (
          <div>
            <span> {group.lable} </span>
            <ul>
              {group.items.map((item)=>{
                return (
                  <li></li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  );
}
