export type AttendeeStatus = "not-arrived" | "checked-in" | "checked-out";
export type TicketType = "General" | "VIP" | "Student";

export type Attendee = {
  id: string;
  name: string;
  ticketId: string;
  ticketType: TicketType;
  status: AttendeeStatus;
  tokens: number;
  lastActionAt?: string;
};

export type ScanOutcome =
  | "checked-in"
  | "checked-out"
  | "expired"
  | "duplicate"
  | "invalid";

export type ScanRecord = {
  id: string;
  time: string;
  attendeeName: string;
  ticketId: string;
  action: "in" | "out";
  outcome: ScanOutcome;
};

export const staffProfile = {
  name: "สมชาย ใจดี",
  role: "Staff · ประตู A",
  topUpQuotaTotal: 2000,
  topUpQuotaUsed: 1350,
};

export const eventInfo = {
  name: "TuaTua Fest 2026",
  date: "21 ต.ค. 2569",
  capacity: 1200,
};

export const attendees: Attendee[] = [
  { id: "a1", name: "ธนกร วงศ์สกุล", ticketId: "TT-000124", ticketType: "General", status: "checked-in", tokens: 250, lastActionAt: "10:42" },
  { id: "a2", name: "พิมพ์ชนก ศรีสุข", ticketId: "TT-000125", ticketType: "VIP", status: "not-arrived", tokens: 800 },
  { id: "a3", name: "กิตติพงษ์ แก้วมณี", ticketId: "TT-000126", ticketType: "Student", status: "checked-out", tokens: 40, lastActionAt: "12:05" },
  { id: "a4", name: "อรอุมา เจริญผล", ticketId: "TT-000127", ticketType: "General", status: "checked-in", tokens: 120, lastActionAt: "11:18" },
  { id: "a5", name: "วีรภัทร สุขสวัสดิ์", ticketId: "TT-000128", ticketType: "General", status: "not-arrived", tokens: 0 },
  { id: "a6", name: "ณัฐธิดา บุญเรือง", ticketId: "TT-000129", ticketType: "VIP", status: "checked-in", tokens: 1500, lastActionAt: "09:55" },
  { id: "a7", name: "ปวีณา มั่นคง", ticketId: "TT-000130", ticketType: "Student", status: "not-arrived", tokens: 60 },
  { id: "a8", name: "รัชชานนท์ ทองดี", ticketId: "TT-000131", ticketType: "General", status: "checked-in", tokens: 310, lastActionAt: "10:03" },
];

export const scanHistory: ScanRecord[] = [
  { id: "s1", time: "12:05", attendeeName: "กิตติพงษ์ แก้วมณี", ticketId: "TT-000126", action: "out", outcome: "checked-out" },
  { id: "s2", time: "11:52", attendeeName: "ไม่ทราบชื่อ", ticketId: "TT-999001", action: "in", outcome: "invalid" },
  { id: "s3", time: "11:18", attendeeName: "อรอุมา เจริญผล", ticketId: "TT-000127", action: "in", outcome: "checked-in" },
  { id: "s4", time: "11:16", attendeeName: "อรอุมา เจริญผล", ticketId: "TT-000127", action: "in", outcome: "duplicate" },
  { id: "s5", time: "10:42", attendeeName: "ธนกร วงศ์สกุล", ticketId: "TT-000124", action: "in", outcome: "checked-in" },
  { id: "s6", time: "10:30", attendeeName: "ผู้เข้าร่วม (บัตรเก่า)", ticketId: "TT-000007", action: "in", outcome: "expired" },
  { id: "s7", time: "10:03", attendeeName: "รัชชานนท์ ทองดี", ticketId: "TT-000131", action: "in", outcome: "checked-in" },
  { id: "s8", time: "09:55", attendeeName: "ณัฐธิดา บุญเรือง", ticketId: "TT-000129", action: "in", outcome: "checked-in" },
];

export const outcomeLabel: Record<ScanOutcome, string> = {
  "checked-in": "เช็กอินสำเร็จ",
  "checked-out": "เช็กเอาท์สำเร็จ",
  expired: "QR หมดอายุ",
  duplicate: "สแกนซ้ำ",
  invalid: "บัตรไม่ถูกต้อง",
};

export const statusLabel: Record<AttendeeStatus, string> = {
  "not-arrived": "ยังไม่เข้างาน",
  "checked-in": "อยู่ในงาน",
  "checked-out": "ออกจากงานแล้ว",
};

export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}
