import { redirect } from "next/navigation";

// หน้าโปรไฟล์ย้ายไปอยู่ที่ /account แล้ว
export default function ProfilePage() {
    redirect("/account");
}
