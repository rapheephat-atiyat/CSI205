import "reflect-metadata";
import { hashPassword } from "better-auth/crypto";
import { In, type EntityManager } from "typeorm";
import type { EventSummary, OrderSouvenirItem, TicketSouvenir } from "@/lib/api-types";
import { FALLBACK_EVENTS } from "@/lib/events-mock";
import migrationDataSource from "./data-source.cli";
import {
    Account,
    Events,
    EventSession,
    EventSouvenir,
    EventTicket,
    Order,
    OrderShipping,
    Product,
    SouvenirTicketType,
    Store,
    Ticket,
    User,
    UserRole,
    UserRolePermission,
    Wallet,
    WalletHistory,
} from "./entities";
import {
    ATTENDEE_FIELDS,
    DELIVERY_METHODS,
    ORDER_STATUSES,
    SHIPPING_STATUSES,
    TICKET_STATUSES,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
} from "./enums/domain.enum";
import { Role } from "./enums/role.enum";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { seedCheckoutOrders, seedCheckoutSalesExamples } from "./seed-checkout";

const dayMs = 86_400_000;
const demoSlip = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMfkAAAAASUVORK5CYII=";

// ตัวอย่าง HTML ที่ใส่ในช่อง description ได้เลย
const reunionDescription = `
<p style="text-align: center;"><strong>TUATUA NIGHT REUNION 2026</strong><br>กลับมาเจอเพื่อนที่เคยนั่งข้างกัน</p>
<p>นัดเจอกันที่มหาวิทยาลัยอีกครั้ง เริ่มเย็นด้วยการเดินดูภาพถ่ายสมัยเรียนหน้าโถง แล้วค่อยชวนเพื่อนหาอะไรกินก่อนเข้าหอประชุม ใครมาเดี่ยวให้แวะโต๊ะลงทะเบียนได้เลย ทีมงานจะช่วยหากลุ่มเพื่อนตามรุ่นให้</p>
<h2>เย็นนี้มีอะไรให้ทำบ้าง</h2>
<ul>
  <li><strong>มุมภาพถ่ายรุ่น</strong> เลือกรุ่นจากป้ายหน้าโถง แล้วหาภาพกิจกรรมที่ตัวเองเคยร่วม ถ้าพกภาพมาด้วย ฝากสแกนไว้ที่โต๊ะรวมภาพได้</li>
  <li><strong>ร้านอาหารศิษย์เก่า</strong> ร้านอยู่บริเวณโถงชั้น 14 แวะดูเมนูและเติมโทเคนที่เคาน์เตอร์ก่อนสั่งอาหาร</li>
  <li><strong>ดนตรีสดในหอประชุม</strong> วงศิษย์เก่าเล่นเพลงจากหลายรุ่น ช่วงท้ายมีเวลาถ่ายภาพรวมและนัดเพื่อนไปต่อ</li>
</ul>
<figure>
  <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&amp;fit=crop&amp;w=1200&amp;q=85" alt="ผู้ชมมองไปยังเวทีดนตรีที่มีไฟส่องเหนือเวที">
  <figcaption>บรรยากาศเวทีดนตรีช่วงค่ำ</figcaption>
</figure>
<h2>กำหนดการช่วงเย็น</h2>
<table>
  <thead><tr><th scope="col">เวลา</th><th scope="col">กิจกรรม</th><th scope="col">จุดนัดหมาย</th></tr></thead>
  <tbody>
    <tr><th scope="row">16.30 น.</th><td>เปิดลงทะเบียนและจุดรับของที่ระลึก</td><td>โถงชั้น 14</td></tr>
    <tr><th scope="row">17.30 น.</th><td>เปิดร้านอาหารและถ่ายรูปตามรุ่น</td><td>หน้าหอประชุม</td></tr>
    <tr><th scope="row">19.00 น.</th><td>วงศิษย์เก่าเริ่มเล่น</td><td>เวทีหลัก</td></tr>
    <tr><th scope="row">21.00 น.</th><td>ถ่ายภาพรวมก่อนปิดงาน</td><td>หน้าขอบเวที</td></tr>
  </tbody>
</table>
<h2>บัตรและของที่ระลึก</h2>
<p>บัตรทุกประเภทรับเข็มกลัดได้ บัตร <strong>Regular</strong> และ <strong>VIP</strong> มีเสื้อที่ระลึกให้เลือกไซซ์ตอนจอง ถ้าจองให้หลายคน ให้เช็กชื่อและไซซ์ของแต่ละใบก่อนกดยืนยัน สามารถเพิ่มเสื้อหรือพวงกุญแจในคำสั่งซื้อ และเลือกว่าจะรับที่งานหรือให้จัดส่ง</p>
<figure>
  <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&amp;fit=crop&amp;w=900&amp;q=85" alt="เสื้อยืดคอกลมสีขาว">
  <figcaption>ภาพประกอบทรงเสื้อยืดที่ระลึก เลือกไซซ์ได้ในขั้นตอนจอง</figcaption>
</figure>
<hr>
<h2>ก่อนออกจากบ้าน</h2>
<ol>
  <li>เปิด <a href="/account/tickets">บัตรของฉัน</a> แล้วบันทึก QR ของแต่ละคนไว้</li>
  <li>ขึ้นลิฟต์อาคาร 11 ไปชั้น 14 จุดสแกนอยู่ฝั่งเดียวกับทางเข้าหอประชุม</li>
  <li>ถ้าเลือกรับของที่งาน ให้เตรียมเลขคำสั่งซื้อไว้ก่อนเข้าคิวรับของ</li>
</ol>
<blockquote>นัดเจอเพื่อนกันหน้าป้ายชื่อรุ่นได้เลย โถงหน้าหอประชุมเปิดก่อนเริ่มดนตรี</blockquote>
`.trim();

const campusDescription = `
<p style="text-align: center;"><strong>CAMPUS MUSIC FEST 2026</strong><br>เย็นนี้เจอกันที่ลาน SPU Arena</p>
<p>เริ่มจากเดินหาเพื่อนและหาอะไรกินที่ Food Market ก่อนถึงรอบวงที่อยากดู ลานแบ่งเป็นโซนหน้าเวทีและโซนยืนด้านหลัง มีทางเดินเลียบขอบลานสำหรับออกไปเติมน้ำหรือกลับมาหากลุ่มเพื่อนระหว่างเปลี่ยนวง</p>
<h2>เลือกจุดดูให้เข้ากับแผนของคุณ</h2>
<h3>Standing Zone A</h3>
<p>โซนยืนหน้าเวทีสำหรับคนที่อยากดูการแสดงใกล้ ๆ ควรเข้าลานก่อนวงที่อยากดูเริ่ม เผื่อเวลาสแกนบัตรและเดินไปตามป้ายโซน</p>
<h3>Standing Zone B</h3>
<p>โซนยืนมาตรฐาน เหมาะกับกลุ่มที่อยากเดินสลับระหว่างเวทีกับ Food Market นัดเพื่อนที่ป้ายบริเวณทางเข้าลานจะหากันง่ายกว่านัดหน้าเวที</p>
<figure>
  <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&amp;fit=crop&amp;w=1200&amp;q=85" alt="แสงจากเวทีเหนือกลุ่มคนดูคอนเสิร์ต">
  <figcaption>ภาพประกอบบรรยากาศช่วงการแสดงบนเวที</figcaption>
</figure>
<h2>เวลาที่ควรเผื่อไว้</h2>
<table>
  <thead><tr><th scope="col">เวลา</th><th scope="col">กิจกรรม</th></tr></thead>
  <tbody>
    <tr><th scope="row">16.00 น.</th><td>เปิดทางเข้าและ Food Market</td></tr>
    <tr><th scope="row">17.00 น.</th><td>วงนักศึกษาเปิดเวที</td></tr>
    <tr><th scope="row">19.00 น.</th><td>เริ่มการแสดงช่วงค่ำ</td></tr>
    <tr><th scope="row">22.00 น.</th><td>จบการแสดง และทยอยออกจากลาน</td></tr>
  </tbody>
</table>
<h2>ซื้ออาหารด้วยโทเคน</h2>
<ol>
  <li><strong>เติมโทเคน</strong> ที่เคาน์เตอร์เจ้าหน้าที่บริเวณทางเข้า Food Market</li>
  <li><strong>แจ้งร้านก่อนจ่าย</strong> ให้ร้านยืนยันเมนูและยอดที่ต้องใช้</li>
  <li><strong>ตรวจยอด</strong> หลังชำระ โดยเปิดดูกระเป๋าโทเคนในบัญชีของคุณ</li>
</ol>
<hr>
<h2>เตรียมก่อนเข้างาน</h2>
<p>บันทึก QR จากหน้าบัตรของฉันไว้ก่อนถึงลาน เผื่อช่วงคนเยอะสัญญาณมือถือช้า ใส่รองเท้าที่เดินและยืนได้นาน และเช็กสภาพอากาศก่อนออกเดินทางเพราะพื้นที่แสดงเป็นลานกลางแจ้ง</p>
<blockquote>ถ้ามากันหลายคน ให้แยก QR ตามชื่อบนบัตรก่อนเข้าคิว จะได้สแกนทีละคนได้เลย</blockquote>
`.trim();

const galaDescription = `
<p style="text-align: center;"><strong>TECH ALUMNI GALA</strong><br>มื้อเย็นที่มีเวลาคุยกันจริง ๆ</p>
<p>งานเลี้ยงสำหรับศิษย์เก่าสายเทคโนโลยีที่อยากเจอเพื่อนต่างรุ่นและเพื่อนร่วมสายงาน ช่วงแรกเป็นเวลาทักทายที่โถง หลังจากนั้นค่อยเข้าห้องอาหารและฟังเรื่องจากศิษย์เก่าที่ทำงานด้านผลิตภัณฑ์ ข้อมูล และซอฟต์แวร์ โต๊ะอาหารจัดให้คุยข้ามสายงานได้ตลอดมื้อ</p>
<figure>
  <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&amp;fit=crop&amp;w=1200&amp;q=85" alt="โต๊ะจัดเลี้ยงในห้องบอลรูมพร้อมชุดจานและแก้ว">
  <figcaption>ภาพประกอบการจัดโต๊ะอาหารสำหรับช่วงกาล่าดินเนอร์</figcaption>
</figure>
<h2>โปรแกรมของค่ำคืน</h2>
<table>
  <thead><tr><th scope="col">เวลา</th><th scope="col">กิจกรรม</th><th scope="col">พื้นที่</th></tr></thead>
  <tbody>
    <tr><th scope="row">17.30 น.</th><td>ลงทะเบียนและรับป้ายชื่อ</td><td>หน้า Grand Ballroom</td></tr>
    <tr><th scope="row">18.15 น.</th><td>พบปะก่อนมื้อเย็น</td><td>โถงรับรอง</td></tr>
    <tr><th scope="row">19.00 น.</th><td>เสิร์ฟอาหารและเปิดวงสนทนา</td><td>โต๊ะอาหาร</td></tr>
    <tr><th scope="row">20.15 น.</th><td>คุยต่อและแลกช่องทางติดต่อ</td><td>โถงรับรอง</td></tr>
  </tbody>
</table>
<h2>รายละเอียดสำหรับผู้ถือบัตร</h2>
<ul>
  <li><strong>สิ่งที่รวมในบัตร</strong> ที่นั่งในห้องบอลรูม อาหารเย็น และกระบอกน้ำที่ระลึก</li>
  <li><strong>ของที่ระลึก</strong> กระบอกน้ำมีขนาดเดียว ให้เลือก One Size ตอนจองและระบุว่าจะรับในงานหรือจัดส่ง</li>
  <li><strong>การแต่งกาย</strong> Smart casual หรือเสื้อเชิ้ตกับกางเกงขายาว เหมาะกับทั้งมื้อเย็นและการถ่ายภาพ</li>
</ul>
<h3>มาคนเดียวได้ไหม</h3>
<p>มาเดี่ยวได้ ที่โต๊ะลงทะเบียนสามารถแจ้งหัวข้อที่อยากคุย เช่น การเริ่มงานสายข้อมูลหรือการย้ายมาทำผลิตภัณฑ์ ทีมงานจะชี้จุดพบกลุ่มที่สนใจเรื่องเดียวกันก่อนเข้าห้องอาหาร</p>
<hr>
<h2>เมื่อมาถึงโรงแรม</h2>
<p>ไปที่ Grand Ballroom โรงแรมเซ็นทารา แกรนด์ เซ็นทรัลพลาซา ลาดพร้าว แล้วเปิด QR จาก <a href="/account/tickets">บัตรของฉัน</a> ให้เจ้าหน้าที่สแกน ถ้ามีข้อจำกัดด้านอาหาร แจ้งทีมลงทะเบียนก่อนเข้าห้องเพื่อให้ประสานกับครัว</p>
`.trim();

const eventActivities: Record<string, { intro: string; highlights: string[]; tip: string }> = {
    "red-white-charity-run-2026": {
        intro: "เริ่มวิ่งตอนเช้าในสวนรถไฟ เลือกจังหวะของตัวเองได้ทั้งวิ่งและเดิน เส้นทางผ่านต้นไม้ร่ม ๆ และกลับเข้าเส้นชัยใกล้จุดฝากของ",
        highlights: ["ยืดกล้ามเนื้อพร้อมกันก่อนปล่อยตัว", "เติมน้ำที่จุดพักระหว่างเส้นทาง", "ถ่ายภาพที่ป้ายเส้นชัยกับเพื่อนร่วมรุ่น"],
        tip: "ติดหมายเลขวิ่งไว้ด้านหน้าเสื้อ และเตรียมขวดน้ำกับรองเท้าที่เคยใช้ซ้อม",
    },
    "alumni-football-cup-2026": {
        intro: "ทีมศิษย์เก่ากลับมาเจอกันในสนาม เปิดด้วยรอบแบ่งกลุ่มก่อนเข้าสู่เกมชิงถ้วย ชวนเพื่อนมานั่งเชียร์ฝั่งอัฒจันทร์และเดินพบผู้เล่นระหว่างพักสนามได้",
        highlights: ["เกมรอบแบ่งกลุ่ม", "ช่วงพักสำหรับถ่ายภาพทีม", "รอบชิงและมอบถ้วยหลังจบการแข่งขัน"],
        tip: "เผื่อเวลาเดินจากประตูสนามถึงอัฒจันทร์ โดยใช้หมายเลขโซนที่ระบุบนบัตร",
    },
    "volunteer-camp-northern-smile": {
        intro: "แบ่งทีมช่วยกันจัดหนังสือ ซ่อมชั้นวาง และเตรียมมุมอ่านหนังสือให้เด็ก ๆ งานแต่ละช่วงมีหัวหน้าทีมคอยอธิบายอุปกรณ์และแบ่งงานตามความถนัด",
        highlights: ["นัดรวมและแบ่งกลุ่มก่อนเข้าพื้นที่", "จัดหนังสือตามระดับการอ่าน", "ลองใช้มุมอ่านหนังสือร่วมกับเด็ก ๆ"],
        tip: "เตรียมรองเท้าหุ้มส้น เสื้อที่เลอะได้ และกระบอกน้ำสำหรับใช้ระหว่างทำงาน",
    },
    "charity-gala-dinner-2026": {
        intro: "มื้อเย็นที่จองเวลาไว้สำหรับพบปะและฟังเรื่องราวของโครงการทุน หลังลงทะเบียนสามารถเดินดูภาพกิจกรรมที่โถงก่อนเข้าห้องอาหาร",
        highlights: ["เปิดห้องรับรองและถ่ายภาพ", "อาหารเย็นพร้อมเรื่องเล่าจากทีมโครงการ", "สรุปกิจกรรมของค่ำคืนบนเวที"],
        tip: "แจ้งข้อจำกัดด้านอาหารที่โต๊ะลงทะเบียน เพื่อให้เจ้าหน้าที่ประสานกับครัว",
    },
    "tuatua-homecoming-2026": {
        intro: "กลับมาเดินทางเดิมจากประตูมหาวิทยาลัยถึงหอประชุมอีกครั้ง มีมุมถ่ายภาพแยกตามปีที่จบและโต๊ะรวมหนังสือรุ่นให้เปิดหาภาพเก่า",
        highlights: ["พบเพื่อนตามจุดนัดหมายของแต่ละรุ่น", "เปิดโต๊ะหนังสือรุ่นและภาพถ่าย", "ถ่ายภาพหมู่ตรงบันไดหน้าหอประชุม"],
        tip: "ถ้ามาเป็นกลุ่ม ให้ตกลงชื่อรุ่นที่จะใช้เป็นจุดนัดหมายก่อนเข้าหอประชุม",
    },
    "siam-street-food-carnival": {
        intro: "เดินชิมอาหารตามโซน ตั้งแต่เตาย่างและของทอดไปจนถึงขนมกับเครื่องดื่ม มีที่นั่งพักตรงกลางลาน เหมาะกับการแบ่งกันลองหลายเมนู",
        highlights: ["เดินดูเมนูและราคาแต่ละร้าน", "หาที่นั่งพักในโซนกินร่วมกัน", "แวะซุ้มขนมก่อนออกจากงาน"],
        tip: "สอบถามส่วนประกอบกับร้านก่อนสั่งหากแพ้อาหาร แล้วแยกคิวสั่งจากคิวรับอาหาร",
    },
    "memories-in-frame-photo-expo": {
        intro: "นิทรรศการจัดภาพตามช่วงเวลา เริ่มจากงานพิมพ์ขาวดำก่อนเข้าสู่ภาพสีและภาพดิจิทัล แต่ละชุดมีข้อความสั้น ๆ จากคนถ่ายให้หยุดอ่านระหว่างเดิน",
        highlights: ["ชมภาพพิมพ์ฟิล์มและงานร่วมสมัย", "อ่านเบื้องหลังการเลือกภาพชุดสำคัญ", "พักดูอัลบั้มที่โต๊ะท้ายห้อง"],
        tip: "เว้นทางเดินหน้าภาพให้คนอื่นชมได้ และดูป้ายก่อนใช้แฟลชในห้องนิทรรศการ",
    },
    "freshy-music-fest-2026": {
        intro: "วงดนตรีนักศึกษาเปิดเวทีตั้งแต่ช่วงเย็น ก่อนส่งต่อให้ศิลปินรับเชิญ มีจุดนัดพบหน้าทางเข้าสำหรับกลุ่มที่เดินทางมาคนละเวลา",
        highlights: ["รอบเปิดเวทีของวงนักศึกษา", "ช่วงดนตรีสดของศิลปินรับเชิญ", "จุดพักและเติมน้ำด้านข้างลาน"],
        tip: "เปิด QR ไว้ก่อนเข้าคิว และนัดเพื่อนที่ป้ายโซนด้านนอกแทนการตามหากันหน้าเวที",
    },
    "old-town-night-bike-rally-2026": {
        intro: "ปั่นตามกลุ่มเล็กผ่านถนนในย่านเมืองเก่า มีทีมงานนำทางและจุดหยุดชมแสงไฟเป็นช่วง ๆ เพื่อให้คนที่มาครั้งแรกตามเส้นทางได้",
        highlights: ["ตรวจจักรยานและไฟก่อนปล่อยตัว", "จอดพักที่จุดชมสถาปัตยกรรม", "รวมกลุ่มอีกครั้งที่จุดสิ้นสุด"],
        tip: "เตรียมหมวกนิรภัย ไฟหน้าและไฟท้าย และเผื่อเวลาตรวจลมยางก่อนเริ่ม",
    },
    "bangkok-ai-cloud-summit-2026": {
        intro: "ฟังทีมวิศวกรเล่าจากงานที่ลงมือทำจริง ตั้งแต่การประเมินคุณภาพโมเดลไปจนถึงการจัดการต้นทุนบนคลาวด์ ช่วงพักมีพื้นที่ถามต่อกับคนที่ทำโจทย์คล้ายกัน",
        highlights: ["เสวนาเรื่องการวัดคุณภาพระบบ AI", "กรณีศึกษาการออกแบบระบบบนคลาวด์", "ถามตอบกับคนทำงานหลังจบแต่ละช่วง"],
        tip: "จดคำถามหรือโจทย์ที่เจอมาสั้น ๆ เพื่อใช้คุยในช่วงถามตอบและเวลาเครือข่าย",
    },
    "campus-esports-championship-2026": {
        intro: "ชมการแข่งขันระดับมหาวิทยาลัยในฮอลล์หลัก ระหว่างคู่มีช่วงสรุปการแข่งขันและพื้นที่พักสำหรับคนที่อยากกลับมาดูเฉพาะรอบสำคัญ",
        highlights: ["แข่งขันรอบคัดเลือก", "วิเคราะห์เกมระหว่างคู่", "ชิงชนะเลิศและถ่ายภาพทีม"],
        tip: "เช็กชื่อทีมกับรอบแข่งขันก่อนเลือกเวลาเข้า และเว้นทางเดินรอบเวทีให้ทีมงาน",
    },
    "nextgen-hackathon-48hr": {
        intro: "พัฒนาไอเดียด้านเมืองยั่งยืนจากโจทย์ที่เจอจริง เริ่มด้วยการจับทีมและเลือกปัญหา จากนั้นนำความคืบหน้าไปคุยกับเมนเทอร์ก่อนสาธิตผลงาน",
        highlights: ["เปิดโจทย์และจับทีม", "รับคำแนะนำระหว่างทำต้นแบบ", "นำเสนอแนวคิดและสาธิตให้กรรมการ"],
        tip: "พกแล็ปท็อป สายชาร์จ และไฟล์สำรองไว้สำหรับรอบนำเสนอ",
    },
    "startup-demo-day-bangkok-2026": {
        intro: "ดูทีมผู้ก่อตั้งนำเสนอผลิตภัณฑ์และสิ่งที่เรียนรู้จากลูกค้าชุดแรก หลังเวทีเปิดพื้นที่ให้ทดลองเดโมและถามรายละเอียดกับทีมโดยตรง",
        highlights: ["ฟังการนำเสนอของผู้ก่อตั้ง", "ลองใช้ผลิตภัณฑ์ที่โต๊ะเดโม", "คุยต่อกับทีมและผู้ร่วมงานในโถง"],
        tip: "เลือกทีมที่สนใจไว้ก่อน แล้วเผื่อช่วงพักสำหรับลองเดโมและแลกช่องทางติดต่อ",
    },
    "specialty-coffee-brewing-workshop": {
        intro: "ฝึกดริปตั้งแต่ชั่งเมล็ด บด และคุมน้ำ ไปจนถึงชิมผลต่างจากสูตรสองแบบ แต่ละโต๊ะได้ลองปรับทีละตัวแปรเพื่อเข้าใจว่ารสชาติเปลี่ยนอย่างไร",
        highlights: ["ชิมตัวอย่างจากเมล็ดคนละแหล่ง", "ลองชงด้วยสัดส่วนน้ำและกาแฟที่ต่างกัน", "จดสูตรของตัวเองกลับไปลองที่บ้าน"],
        tip: "ผู้เริ่มต้นเข้าร่วมได้ อุปกรณ์ชงใช้ร่วมกันที่โต๊ะกิจกรรม",
    },
    "book-and-boardgame-fiesta": {
        intro: "เดินเลือกหนังสือจากหลายสำนักพิมพ์แล้วต่อด้วยโต๊ะทดลองเกม มีกติกาเบื้องต้นให้ฟังก่อนเล่น เหมาะกับทั้งคนที่มาเป็นกลุ่มและคนที่อยากหาเพื่อนร่วมโต๊ะ",
        highlights: ["เดินดูหนังสือและฉบับทำมือ", "ฟังกติกาเกมจากคนดูแลโต๊ะ", "รวมกลุ่มทดลองเล่นรอบสั้น"],
        tip: "ถ้ามาคนเดียวให้ถามโต๊ะต้อนรับว่ามีเกมไหนเปิดรับผู้เล่นเพิ่ม",
    },
    "craft-and-canvas-weekend-market": {
        intro: "เดินดูงานพิมพ์ เครื่องปั้น และสิ่งทอจากผู้ทำงานโดยตรง แต่ละร้านมีเรื่องเบื้องหลังวัสดุและเทคนิคที่ใช้ ลองแวะคุยก่อนเลือกชิ้นที่อยากเก็บกลับบ้าน",
        highlights: ["ชมผลงานจากร้านศิลปินอิสระ", "ดูสาธิตการทำงานชิ้นเล็ก", "ลองเลือกวัสดุในมุมเวิร์กชอป"],
        tip: "เตรียมถุงผ้าถ้ามีแผนซื้อภาพพิมพ์ และถามร้านเรื่องวิธีพับหรือม้วนงานก่อนเดินทางกลับ",
    },
    "sunset-acoustic-in-the-park": {
        intro: "นั่งฟังวงอะคูสติกช่วงพระอาทิตย์ตกในสวน พื้นที่หน้าเวทีเหมาะกับการปูเสื่อ ส่วนขอบสนามเป็นทางเดินให้เข้าออกระหว่างการแสดงได้",
        highlights: ["เปิดพื้นที่นั่งก่อนเริ่มดนตรี", "ฟังดนตรีช่วงพระอาทิตย์ตก", "เดินออกทางขอบสนามหลังจบชุดสุดท้าย"],
        tip: "เตรียมเสื่อผืนเล็กและเผื่อเวลาเดินจากประตูสวนถึงบริเวณเวที",
    },
    "chronicles-stage-musical-2026": {
        intro: "ละครเพลงที่พาตัวละครกลับไปเจอการตัดสินใจครั้งสำคัญในชีวิต การแสดงใช้แสงและเพลงสดเล่าเรื่องสลับระหว่างช่วงเวลาบนเวที",
        highlights: ["เปิดประตูให้เข้าที่นั่งก่อนการแสดง", "ชมละครเพลงสององก์", "สนทนาสั้น ๆ กับทีมงานหลังปิดม่าน"],
        tip: "เผื่อเวลาหาที่นั่งก่อนเริ่ม และตั้งมือถือเป็นโหมดเงียบเมื่อเข้าห้องแสดง",
    },
    "indie-short-film-festival-2026": {
        intro: "โปรแกรมหนังสั้นจัดเป็นรอบตามธีม มีทั้งผลงานนักศึกษาและทีมทำหนังอิสระ หลังฉายบางรอบจะมีเวลาพูดคุยถึงแนวคิดเบื้องหลังกับผู้กำกับ",
        highlights: ["ชมโปรแกรมรวมหนังสั้น", "ถามตอบกับทีมสร้างหลังฉาย", "แลกเปลี่ยนมุมมองกันที่โถงโรงภาพยนตร์"],
        tip: "ตรวจรอบที่สนใจก่อนเดินทาง และเผื่อเวลารับบัตรหน้าทางเข้าโรง",
    },
    "chao-phraya-jazz-night-2026": {
        intro: "ฟังแจ๊สสดริมแม่น้ำ ตั้งแต่บรรเลงช่วงเย็นจนถึงวงหลักตอนค่ำ บริเวณที่นั่งเปิดให้มาถึงก่อนเพื่อเลือกมุมและหาอะไรกินระหว่างรอ",
        highlights: ["วงเปิดเล่นช่วงเย็น", "การแสดงช่วงค่ำของวงหลัก", "ช่วงปิดเวทีและพบปะนักดนตรี"],
        tip: "เตรียมเสื้อคลุมบาง ๆ และเผื่อเวลาเดินจากจุดลงรถหรือท่าเรือถึงบริเวณเวที",
    },
};

function catalogEventDescription(event: EventSummary) {
    const activity = eventActivities[event.slug];
    const highlights = activity?.highlights ?? ["ลงทะเบียนที่ทางเข้า", "เข้าร่วมกิจกรรมตามป้ายหน้างาน"];
    const imageUrl = event.thumbnail.replace("w=800", "w=1200").replaceAll("&", "&amp;");
    const mapQuery = encodeURIComponent(event.venue);
    return `
<p><strong>${event.subTitle}</strong></p>
<p>${activity?.intro ?? `พบกันที่ ${event.venue} ทีมงานจะพาไปยังจุดกิจกรรมหลังลงทะเบียน`}</p>
<figure>
  <img src="${imageUrl}" alt="ภาพประกอบบรรยากาศของงาน ${event.title}">
  <figcaption>ภาพประกอบกิจกรรม</figcaption>
</figure>
<h2>กิจกรรมสำคัญ</h2>
<ul>
  ${highlights.map((highlight) => `<li>${highlight}</li>`).join("\n  ")}
</ul>
<h2>การเดินทางและเช็กอิน</h2>
<p>พบกันที่ <strong>${event.venue}</strong> เปิด <a href="https://www.google.com/maps/search/?api=1&amp;query=${mapQuery}">แผนที่สถานที่จัดงาน</a> แล้วเผื่อเวลาเดินจากจุดลงรถ เมื่อถึงทางเข้าให้เปิด QR จาก <a href="/account/tickets">บัตรของฉัน</a> ให้เจ้าหน้าที่สแกนทีละคน</p>
${activity ? `<blockquote>${activity.tip}</blockquote>` : ""}
`.trim();
}

const seedEventDescriptions = new Map<string, string>([
    ["tuatua-reunion-2026", reunionDescription],
    ["campus-music-fest-2026", campusDescription],
    ["tech-alumni-gala-2026", galaDescription],
    ...FALLBACK_EVENTS.map((event) => [event.slug, catalogEventDescription(event)] as const),
]);

async function refreshSeedEventDescriptions(manager: EntityManager) {
    const events = await manager.find(Events, {
        select: { id: true, slug: true, description: true },
        where: { slug: In([...seedEventDescriptions.keys()]) },
    });
    let updatedCount = 0;
    for (const event of events) {
        const description = seedEventDescriptions.get(event.slug);
        if (!description || description === event.description) continue;
        await manager.update(Events, { id: event.id }, { description });
        updatedCount += 1;
    }
    return { foundCount: events.length, updatedCount };
}

const guestNames = [
    ["ณัฐชา", "พูนทรัพย์"], ["ปกรณ์", "ตั้งใจดี"], ["รินรดา", "แสงทอง"], ["ภัทรพล", "ไกรศิริ"],
    ["ชลธิชา", "บุญรักษ์"], ["ธีรภัทร", "วัฒนวงศ์"], ["สุพิชญา", "แก้วมณี"], ["ธนกฤต", "ศรีสมบัติ"],
    ["จิราพร", "เพียรดี"], ["วรินทร", "พงศ์พนา"], ["พัชราภา", "ตั้งสมคิด"], ["ณัฐวุฒิ", "สุขสว่าง"],
    ["มนัสวี", "จันทร์เพ็ญ"], ["พีรพล", "พัฒนกิจ"], ["ปิยธิดา", "ใจงาม"], ["ภาคิน", "ลาภยิ่ง"],
    ["กัญญาวีร์", "แสงอรุณ"], ["สิรวิชญ์", "เรืองเดช"], ["ชนัญชิดา", "อารีรัตน์"], ["อดิศร", "สุวรรณดี"],
    ["กมลชนก", "จิตมั่น"], ["ศรัณย์", "เกตุแก้ว"], ["วรรณพร", "แสนสุข"], ["กรวิชญ์", "ธาราทอง"],
];

const storeExamples = [
    ["ครัวบ้านข้าว", "ข้าวไก่ย่างน้ำจิ้มแจ่ว", 85],
    ["บ้านเส้น", "ก๋วยเตี๋ยวต้มยำ", 75],
    ["ผักสดทุกวัน", "สลัดเต้าหู้ย่าง", 95],
    ["ขนมบ้านยาย", "ข้าวเหนียวมะม่วง", 70],
    ["โรงคั่วหน้ามอ", "ลาเต้เย็น", 85],
    ["น้ำผลไม้ริมทาง", "น้ำส้มคั้น", 55],
    ["โตเกียวหน้าซอย", "โตเกียวไส้รวม", 60],
    ["เตาถ่านเพื่อนเก่า", "หมูสะเต๊ะชุดเล็ก", 105],
    ["อิ่มคำ", "ข้าวปั้นไส้แซลมอน", 65],
    ["ขนมปังชาวคณะ", "โทสต์เนยนม", 59.5],
    ["โกโก้วันหยุด", "โกโก้เข้มข้น", 79.5],
    ["บูธครัวทดลอง", null, 0],
] as const;

function seedNumber(index: number) {
    return String(index + 1).padStart(2, "0");
}

function extraUser(username: string, firstName: string, lastName: string) {
    return {
        email: `${username}@tuatua.com`,
        username,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: null,
        graduationAt: null,
        graduationInstitution: null,
        balance: "0.00",
        emailVerified: true,
        status: "ACTIVE" as User["status"],
    };
}

type ScheduleSlot = {
    title: string;
    start: string;
    end: string;
};

async function seedEventSchedule(manager: EntityManager, event: Events, slots: ScheduleSlot[]) {
    // งานตัวอย่างเริ่มวันถัดจากวันปิดขาย เวลาในรายการเป็นเวลาไทย
    const bangkokDay = new Date(event.buyEndAt.getTime() + dayMs + 7 * 60 * 60_000);
    function timeOnEventDay(time: string) {
        const [hour, minute] = time.split(":").map(Number);
        return new Date(Date.UTC(bangkokDay.getUTCFullYear(), bangkokDay.getUTCMonth(), bangkokDay.getUTCDate(), hour - 7, minute));
    }

    await manager.insert(EventSession, slots.map((slot) => ({
        eventId: event.id,
        title: slot.title,
        startsAt: timeOnEventDay(slot.start),
        endsAt: timeOnEventDay(slot.end),
    })));
}

async function seedSouvenirTicketTypes(manager: EntityManager, souvenir: EventSouvenir, ticketTypes: EventTicket[]) {
    await manager.insert(SouvenirTicketType, ticketTypes.map((ticketType) => ({
        souvenirId: souvenir.id,
        ticketTypeId: ticketType.id,
        eventId: souvenir.eventId,
    })));
}

// งานที่หน้าเว็บเคยเห็นจากข้อมูลสำรอง มีข้อมูลจริงให้จองและเปิดประวัติได้ด้วย
async function seedMoreEvents(manager: EntityManager, seededAt: Date) {
    const date = (days: number) => new Date(seededAt.getTime() + days * dayMs);
    const eventCatalog = [];

    for (const [index, sample] of FALLBACK_EVENTS.entries()) {
        const upcoming = index >= 18;
        const closed = index === 16 || index === 17;
        const soldOut = index === 4 || index === 11;
        const hasSouvenirs = index % 4 !== 0;
        const allowShipping = hasSouvenirs && index % 2 === 1;
        const event = await manager.save(Events, {
            slug: sample.slug,
            title: sample.title,
            subTitle: sample.subTitle,
            thumbnail: sample.thumbnail,
            banner: sample.thumbnail.replace("w=800", "w=1600"),
            venue: sample.venue,
            tags: sample.tags,
            description: catalogEventDescription(sample),
            buyAt: date(upcoming ? 5 : -21),
            buyEndAt: date(closed ? -2 : 15 + index),
            allowShipping,
            shippingFee: allowShipping ? (45 + index % 3 * 10).toFixed(2) : "0.00",
            minTicketQTY: 1,
            maxTicketQTY: 6,
        });
        const firstActivity = eventActivities[sample.slug]?.highlights[0] ?? "กิจกรรมหลัก";
        const eveningEvent = sample.tags.some((tag) => ["คอนเสิร์ต", "ดนตรีสด", "กาล่าดินเนอร์", "แจ๊ส"].includes(tag));
        await seedEventSchedule(manager, event, eveningEvent ? [
            { title: "เปิดลงทะเบียน", start: "16:30", end: "17:30" },
            { title: firstActivity, start: "17:30", end: "19:30" },
        ] : [
            { title: "เปิดลงทะเบียน", start: "08:30", end: "09:30" },
            { title: firstActivity, start: "09:30", end: "11:30" },
        ]);

        const basePrice = 150 + index % 8 * 50;
        const ticketTypes = await manager.save(EventTicket, [
            {
                eventId: event.id, name: index % 5 === 0 ? "บัตรเข้าร่วมฟรี" : "บัตรทั่วไป",
                description: "เข้าร่วมงานตามรอบปกติ", price: index % 5 === 0 ? "0.00" : basePrice.toFixed(2),
                quota: soldOut ? 4 : 60, maxTicketQTY: 4, sortOrder: 1,
                requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME],
            },
            {
                eventId: event.id, name: "บัตรพรีเมียม",
                description: "สำรองที่นั่งโซนหน้า", price: (basePrice + 250.5).toFixed(2),
                quota: soldOut ? 4 : 24, maxTicketQTY: 2, sortOrder: 2,
                requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.EMAIL],
            },
            {
                eventId: event.id, name: "บัตรกลุ่ม (ขั้นต่ำ 2 ใบ)",
                description: "ราคาต่อคนสำหรับจองพร้อมเพื่อน", price: (basePrice - 35).toFixed(2),
                quota: soldOut ? 8 : 40, minTicketQTY: 2, maxTicketQTY: 4, sortOrder: 3,
                requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.PHONE],
            },
        ]);

        const [, premium, group] = ticketTypes;
        const savedSouvenirs = hasSouvenirs ? await manager.save(manager.create(EventSouvenir, [
            {
                eventId: event.id, name: index % 2 === 0 ? "เข็มกลัดประจำงาน" : "โปสการ์ดประจำงาน",
                allTicketTypes: true, allowDecline: index % 3 !== 0,
            },
            {
                eventId: event.id, name: "เสื้อที่ระลึกประจำงาน",
                sizes: ["S", "M", "L", "XL"], extraPrice: "179.50",
            },
            {
                eventId: event.id, name: index % 2 === 0 ? "กระเป๋าผ้าพิมพ์ลาย" : "สมุดโน้ตประจำงาน",
                extraPrice: "69.00",
            },
        ])) : [];

        const shirt = savedSouvenirs[1];
        if (shirt) await seedSouvenirTicketTypes(manager, shirt, [premium, group]);
        const souvenirs = savedSouvenirs.map((souvenir) => ({
            ...souvenir,
            eligibleTicketTypeIds: souvenir.id === shirt?.id ? [premium.id, group.id] : [],
        }));

        eventCatalog.push({ event, ticketTypes, souvenirs, upcoming, closed, soldOut });
    }

    return eventCatalog;
}

// ออเดอร์ตัวอย่างสร้างยอดจากราคาบัตร ของที่ซื้อเพิ่ม และค่าจัดส่ง
async function seedMoreOrders(
    manager: EntityManager,
    eventCatalog: Awaited<ReturnType<typeof seedMoreEvents>>,
    buyers: User[],
    checkInStaff: User,
    seededAt: Date
) {
    const shippingStatuses = [SHIPPING_STATUSES.PREPARING, SHIPPING_STATUSES.SHIPPED, SHIPPING_STATUSES.DELIVERED];

    for (const [eventIndex, example] of eventCatalog.entries()) {
        if (example.upcoming) continue;
        const { event, ticketTypes, souvenirs, closed, soldOut } = example;
        const [standard, premium, group] = ticketTypes;
        const ticketChoices = soldOut
            ? Array.from({ length: 4 }, () => [standard, premium, group, group])
            : [[standard], [premium], [group, group], [standard, premium], [standard, standard], [premium, premium]];
        const reservedCount = new Map<string, number>();

        for (const [orderIndex, selectedTickets] of ticketChoices.entries()) {
            const buyerIndex = orderIndex < 2 ? orderIndex : 2 + (eventIndex * 5 + orderIndex - 2) % (buyers.length - 2);
            const buyer = buyers[buyerIndex];
            const orderCode = `BULK-${seedNumber(eventIndex)}-${seedNumber(orderIndex)}`;
            const includeOptional = orderIndex !== 4;
            const issuedTickets = selectedTickets.map((ticketType, ticketIndex) => {
                const souvenirItems: TicketSouvenir[] = souvenirs
                    .filter((item) => item.allTicketTypes || item.eligibleTicketTypeIds.includes(ticketType.id))
                    .filter((item) => !item.allowDecline || includeOptional)
                    .map((item) => ({
                        souvenirId: item.id,
                        name: item.name,
                        size: item.sizes?.[(orderIndex + ticketIndex) % item.sizes.length] ?? null,
                    }));
                return { ticketType, souvenirItems };
            });
            const extras: OrderSouvenirItem[] = [];
            if (orderIndex === 3) {
                for (const item of souvenirs) {
                    if (!item.extraPrice) continue;
                    extras.push({ souvenirId: item.id, name: item.name, size: item.sizes?.[1] ?? null, unitPrice: item.extraPrice, quantity: 2 });
                }
            }

            const hasSouvenirs = extras.length > 0 || issuedTickets.some((ticket) => ticket.souvenirItems.length > 0);
            const wantsShipping = event.allowShipping && hasSouvenirs && [0, 3].includes(orderIndex);
            const shippingFee = wantsShipping ? Number(event.shippingFee) : 0;
            const ticketTotal = selectedTickets.reduce((sum, ticket) => sum + Number(ticket.price), 0);
            const extraTotal = extras.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
            const total = (ticketTotal + extraTotal + shippingFee).toFixed(2);
            const cancelled = !soldOut && orderIndex === 5;
            const awaitingPayment = !soldOut && !closed && orderIndex === 4 && Number(total) > 0;
            const awaitingReview = !soldOut && !closed && orderIndex === 3;
            const status = cancelled ? ORDER_STATUSES.CANCELLED
                : awaitingPayment || awaitingReview ? ORDER_STATUSES.PENDING : ORDER_STATUSES.PAID;
            const createdAt = awaitingPayment ? seededAt
                : new Date(seededAt.getTime() - (closed ? 9 : 3) * dayMs + orderIndex * 60_000);
            const paidAt = status === ORDER_STATUSES.PAID ? new Date(createdAt.getTime() + 10 * 60_000) : null;
            const order = await manager.save(Order, {
                orderNo: `ORD-${orderCode}`, userId: buyer.id, eventId: event.id, total, status, createdAt, paidAt,
                paymentSlip: awaitingReview || (paidAt && Number(total) > 0) ? demoSlip : null,
                deliveryMethod: wantsShipping ? DELIVERY_METHODS.SHIPPING : hasSouvenirs ? DELIVERY_METHODS.PICKUP : DELIVERY_METHODS.NONE,
                shippingFee: shippingFee.toFixed(2),
                souvenirItems: extras,
            });

            if (wantsShipping) {
                const shippingStatus = paidAt ? shippingStatuses[eventIndex % shippingStatuses.length] : SHIPPING_STATUSES.PENDING;
                const shipped = shippingStatus === SHIPPING_STATUSES.SHIPPED || shippingStatus === SHIPPING_STATUSES.DELIVERED;
                await manager.insert(OrderShipping, {
                    orderId: order.id, recipientName: buyer.name, recipientPhone: buyer.phone ?? "0800000000",
                    addressLine: `${20 + eventIndex}/9 ถนนพหลโยธิน`,
                    subDistrict: "เสนานิคม", district: "จตุจักร", province: "กรุงเทพมหานคร", postalCode: "10900",
                    status: shippingStatus, carrier: shipped ? "ไปรษณีย์ไทย" : null,
                    trackingNumber: shipped ? `DEMO-${orderCode}` : null,
                    shippedAt: shipped ? new Date(createdAt.getTime() + dayMs) : null,
                });
            }

            for (const [ticketIndex, { ticketType, souvenirItems }] of issuedTickets.entries()) {
                const used = Boolean(paidAt) && (closed || (eventIndex % 3 === 0 && orderIndex === 0));
                const ticketStatus = cancelled ? TICKET_STATUSES.CANCELLED
                    : used ? TICKET_STATUSES.USED : paidAt ? TICKET_STATUSES.ACTIVE : TICKET_STATUSES.PENDING;
                const attendee = ticketIndex === 0 ? buyer : buyers[2 + (buyerIndex + ticketIndex) % (buyers.length - 2)];
                await manager.insert(Ticket, {
                    orderId: order.id, eventId: event.id, eventTicketId: ticketType.id, userId: buyer.id,
                    unitPrice: ticketType.price, status: ticketStatus,
                    ticketCode: `TKT-${orderCode}-${seedNumber(ticketIndex)}`, qrToken: crypto.randomUUID(),
                    firstName: attendee.firstName, lastName: attendee.lastName, phone: attendee.phone,
                    email: attendee.email, graduationYear: attendee.graduationAt ? String(attendee.graduationAt.getUTCFullYear() + 543) : null,
                    souvenirItems,
                    checkedInAt: used ? new Date(createdAt.getTime() + dayMs) : null,
                    checkedInById: used ? checkInStaff.id : null,
                    createdAt,
                });
                if (!cancelled) reservedCount.set(ticketType.id, (reservedCount.get(ticketType.id) ?? 0) + 1);
            }
        }

        for (const [ticketTypeId, sold] of reservedCount) {
            await manager.update(EventTicket, { id: ticketTypeId }, { sold });
        }
    }
}

async function seedMoreStores(
    manager: EntityManager,
    eventCatalog: Awaited<ReturnType<typeof seedMoreEvents>>,
) {
    const shops = [];
    for (const [index, [name, product, price]] of storeExamples.entries()) {
        const { event } = eventCatalog[index % 8];
        const store = await manager.save(Store, {
            eventId: event.id,
            name,
            description: product ? `รับโทเคนสำหรับซื้อ${product}ภายในงาน` : "บูธใหม่ที่ยังไม่ได้ลงสินค้า",
        });
        const wallet = await manager.save(Wallet, { storeId: store.id, total: "0.00" });
        if (product) {
            await manager.insert(Product, {
                storeId: store.id, title: product, description: `เมนูประจำร้าน${name}`, price: price.toFixed(2),
            });
        }
        shops.push({ store, wallet, product, price });
    }
    return shops;
}

async function seedMoreWalletActivity(
    manager: EntityManager,
    buyers: User[],
    userWallets: Record<string, Wallet>,
    shops: Awaited<ReturnType<typeof seedMoreStores>>,
    topUpStaff: User,
    refundStaff: User,
    seededAt: Date,
) {
    const openShops = shops.filter((shop) => shop.product !== null);
    for (const [index, buyer] of buyers.entries()) {
        const wallet = userWallets[buyer.email];
        const startTime = seededAt.getTime() - 2 * dayMs + index * 60 * 60_000;
        let balance = 500 + index % 8 * 100;
        await manager.insert(WalletHistory, {
            walletId: wallet.id, type: TRANSACTION_TYPES.TOPUP, amount: balance.toFixed(2),
            before: "0.00", after: balance.toFixed(2), ref: topUpStaff.id, note: "เติมโทเคนที่เคาน์เตอร์หน้างาน",
            createdAt: new Date(startTime),
        });

        for (let purchaseIndex = 0; purchaseIndex < 3; purchaseIndex++) {
            const shop = openShops[(index + purchaseIndex * 3) % openShops.length];
            const createdAt = new Date(startTime + (purchaseIndex + 1) * 60_000);
            const buyerBefore = balance;
            balance -= shop.price;
            const storeBefore = Number(shop.wallet.total);
            shop.wallet.total = (storeBefore + shop.price).toFixed(2);
            await manager.insert(WalletHistory, [
                {
                    walletId: wallet.id, type: TRANSACTION_TYPES.PURCHASE, amount: shop.price.toFixed(2),
                    before: buyerBefore.toFixed(2), after: balance.toFixed(2), ref: shop.store.id,
                    note: `ซื้อ${shop.product}`, createdAt,
                },
                {
                    walletId: shop.wallet.id, type: TRANSACTION_TYPES.PURCHASE, amount: shop.price.toFixed(2),
                    before: storeBefore.toFixed(2), after: shop.wallet.total, ref: buyer.id,
                    note: `รับโทเคนค่า${shop.product}`, createdAt,
                },
            ]);
        }

        const refund = index % 3 === 0 ? balance : 100;
        const refundStatus = [TRANSACTION_STATUSES.COMPLETED, TRANSACTION_STATUSES.PENDING, TRANSACTION_STATUSES.REJECTED][index % 3];
        const balanceAfterRefund = refundStatus === TRANSACTION_STATUSES.COMPLETED ? balance - refund : balance;
        await manager.insert(WalletHistory, {
            walletId: wallet.id, type: TRANSACTION_TYPES.REFUND, status: refundStatus, amount: refund.toFixed(2),
            before: balance.toFixed(2), after: balanceAfterRefund.toFixed(2), ref: refundStaff.id,
            note: "ขอแลกโทเคนที่เหลือคืน", createdAt: new Date(startTime + 5 * 60_000),
        });
        await manager.update(Wallet, { id: wallet.id }, { total: balanceAfterRefund.toFixed(2) });
    }

    for (const { wallet } of shops) {
        await manager.update(Wallet, { id: wallet.id }, { total: wallet.total });
    }
}

async function runSeed() {
    const isReset = process.argv.includes("--reset");
    const descriptionsOnly = process.argv.includes("--event-descriptions-only");

    console.log("⏳ กำลังเชื่อมต่อฐานข้อมูล Supabase...");
    await migrationDataSource.initialize();

    try {
        if (descriptionsOnly) {
            const { foundCount, updatedCount } = await migrationDataSource.transaction(refreshSeedEventDescriptions);
            console.log(`พบงานตัวอย่าง ${foundCount} งาน อัปเดตรายละเอียด ${updatedCount} งาน`);
            return;
        }

        if (isReset) {
            console.log("🗑️  กำลังล้างตารางและ Enum ทั้งหมดบนฐานข้อมูล (Drop Schema)...");
            await migrationDataSource.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
            await migrationDataSource.query(`CREATE SCHEMA public;`);
            await migrationDataSource.query(`GRANT ALL ON SCHEMA public TO postgres;`);
            await migrationDataSource.query(`GRANT ALL ON SCHEMA public TO public;`);

            console.log("🚀 กำลังรัน Migration สร้างตารางใหม่ทั้งหมด...");
            await migrationDataSource.runMigrations();
        }

        console.log("🌱 กำลังสร้างข้อมูล Mockup (Seed Data)...");
        const passwordHash = await hashPassword("password123");
        const seededAt = new Date();
        const salesStart = new Date(seededAt.getTime() - 7 * dayMs);
        const salesEnd = new Date(seededAt.getTime() + 30 * dayMs);
        const guests = guestNames.map(([firstName, lastName], index) => ({
            ...extraUser(`demo${seedNumber(index)}`, firstName, lastName),
            phone: `08010000${seedNumber(index)}`,
            graduationAt: new Date(Date.UTC(2012 + index % 14, 4, 1)),
            graduationInstitution: ["คณะเทคโนโลยีสารสนเทศ", "คณะนิเทศศาสตร์", "คณะบริหารธุรกิจ", "คณะวิศวกรรมศาสตร์"][index % 4],
        }));
        const vendors = storeExamples.map(([name], index) =>
            extraUser(`demo-vendor${seedNumber(index)}`, "ร้านค้า", name)
        );
        const extraAccounts = [
            extraUser("empty", "ผู้ใช้", "ยังไม่มีรายการ"),
            { ...extraUser("suspended", "ผู้ใช้", "ระงับการใช้งาน"), status: "SUSPENDED" as const },
            { ...extraUser("unverified", "ผู้ใช้", "รอยืนยันอีเมล"), emailVerified: false },
            extraUser("demo-checkin", "เจ้าหน้าที่", "เช็กอินหลายงาน"),
            extraUser("demo-topup", "เจ้าหน้าที่", "เติมโทเคน"),
            extraUser("demo-refund", "เจ้าหน้าที่", "ดูแลการคืนโทเคน"),
        ];

        await migrationDataSource.transaction(async (manager) => {
            // ==========================================
            // 1. สร้าง Users & Accounts (รหัสผ่านทุกคนคือ: password123)
            // ==========================================
            const originalUsers = [
                {
                    email: "admin@tuatua.com",
                    username: "admin",
                    firstName: "กิตติพงศ์",
                    lastName: "ผู้ดูแลระบบ",
                    name: "กิตติพงศ์ ผู้ดูแลระบบ",
                    phone: "0811111111",
                    graduationAt: new Date("2020-05-01"),
                    graduationInstitution: "คณะเทคโนโลยีสารสนเทศ",
                    balance: "5000.00",
                },
                {
                    email: "vendor1@tuatua.com",
                    username: "vendor_mala",
                    firstName: "สมชาย",
                    lastName: "สายปิ้งย่าง",
                    name: "สมชาย สายปิ้งย่าง",
                    phone: "0822222222",
                    graduationAt: new Date("2021-05-01"),
                    graduationInstitution: "คณะบริหารธุรกิจ",
                    balance: "1200.00",
                },
                {
                    email: "vendor2@tuatua.com",
                    username: "vendor_drink",
                    firstName: "แพรวา",
                    lastName: "บาร์เทนเดอร์",
                    name: "แพรวา บาร์เทนเดอร์",
                    phone: "0833333333",
                    graduationAt: new Date("2022-05-01"),
                    graduationInstitution: "คณะนิเทศศาสตร์",
                    balance: "800.00",
                },
                {
                    email: "staff@tuatua.com",
                    username: "staff_gate",
                    firstName: "วรพล",
                    lastName: "จุดลงทะเบียน",
                    name: "วรพล จุดลงทะเบียน",
                    phone: "0844444444",
                    graduationAt: new Date("2023-05-01"),
                    graduationInstitution: "คณะวิศวกรรมศาสตร์",
                    balance: "500.00",
                },
                {
                    email: "user1@tuatua.com",
                    username: "rapheephat",
                    firstName: "รพีภัทร",
                    lastName: "ศิษย์เก่าดีเด่น",
                    name: "รพีภัทร ศิษย์เก่าดีเด่น",
                    phone: "0855555555",
                    graduationAt: new Date("2024-05-01"),
                    graduationInstitution: "คณะเทคโนโลยีสารสนเทศ",
                    balance: "1815.00",
                },
                {
                    email: "user2@tuatua.com",
                    username: "pimchanok",
                    firstName: "พิมพ์ชนก",
                    lastName: "ร่วมงานสนุก",
                    name: "พิมพ์ชนก ร่วมงานสนุก",
                    phone: "0866666666",
                    graduationAt: new Date("2023-05-01"),
                    graduationInstitution: "คณะศิลปกรรมศาสตร์",
                    balance: "3200.00",
                },
            ];
            const usersData = [
                ...originalUsers.map((user) => ({ ...user, emailVerified: true, status: "ACTIVE" as const })),
                ...guests,
                ...vendors,
                ...extraAccounts,
            ];

            const savedUsers: Record<string, User> = {};
            const userWallets: Record<string, Wallet> = {};

            for (const u of usersData) {
                const user = await manager.save(
                    manager.create(User, {
                        email: u.email,
                        emailVerified: u.emailVerified,
                        username: u.username,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        name: u.name,
                        phone: u.phone,
                        graduationAt: u.graduationAt,
                        graduationInstitution: u.graduationInstitution,
                        status: u.status,
                    })
                );
                savedUsers[u.email] = user;

                await manager.save(
                    manager.create(Account, {
                        userId: user.id,
                        accountId: user.id,
                        providerId: "credential",
                        password: passwordHash,
                    })
                );

                const wallet = await manager.save(
                    manager.create(Wallet, {
                        userId: user.id,
                        total: u.balance,
                    })
                );
                userWallets[u.email] = wallet;
            }

            // ==========================================
            // 2. สร้าง Events (3 งาน)
            // ==========================================
            const event1 = await manager.save(
                manager.create(Events, {
                    slug: "tuatua-reunion-2026",
                    title: "TUATUA Night Reunion 2026: คืนสู่เหย้าชาวเทคโนฯ",
                    subTitle: "กลับมาพบเพื่อนเก่า ย้อนวันวาน พร้อมมินิคอนเสิร์ตและบูธร้านค้าศิษย์เก่ากว่า 20 ร้าน",
                    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
                    venue: "หอประชุมใหญ่ มหาวิทยาลัยศรีปทุม อาคาร 11 ชั้น 14",
                    description: reunionDescription,
                    tags: ["งานเลี้ยงรุ่น", "คอนเสิร์ต", "ศิษย์เก่า", "Reunion"],
                    allowShipping: true,
                    shippingFee: "50.00",
                    buyAt: salesStart,
                    buyEndAt: salesEnd,
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                })
            );

            const event2 = await manager.save(
                manager.create(Events, {
                    slug: "campus-music-fest-2026",
                    title: "Campus Music Festival 2026: ปรากฏการณ์ดนตรีกลางแจ้ง",
                    subTitle: "เทศกาลดนตรีสุดมันส์รวมศิลปินอินดี้และป๊อปแถวหน้าของเมืองไทย",
                    banner: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
                    venue: "ลานกิจกรรมกลางแจ้ง SPU Arena",
                    description: campusDescription,
                    tags: ["เทศกาลดนตรี", "Music Festival", "Outdoor"],
                    allowShipping: false,
                    shippingFee: "0.00",
                    buyAt: salesStart,
                    buyEndAt: salesEnd,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                })
            );

            const event3 = await manager.save(
                manager.create(Events, {
                    slug: "tech-alumni-gala-2026",
                    title: "Tech Alumni Gala Dinner & Networking 2026",
                    subTitle: "ค่ำคืนแห่งการสร้างเครือข่ายสายเทคโนโลยีและสตาร์ทอัพ",
                    banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
                    venue: "Grand Ballroom โรงแรมเซ็นทารา แกรนด์ เซ็นทรัลพลาซา ลาดพร้าว",
                    description: galaDescription,
                    tags: ["Networking", "Gala Dinner", "Tech"],
                    allowShipping: true,
                    shippingFee: "60.00",
                    buyAt: salesStart,
                    buyEndAt: salesEnd,
                    minTicketQTY: 1,
                    maxTicketQTY: 2,
                })
            );

            await seedEventSchedule(manager, event1, [
                { title: "เปิดลงทะเบียนและจุดรับของที่ระลึก", start: "16:30", end: "17:30" },
                { title: "เปิดร้านอาหารและถ่ายรูปตามรุ่น", start: "17:30", end: "19:00" },
                { title: "การแสดงของวงศิษย์เก่า", start: "19:00", end: "21:00" },
                { title: "ถ่ายภาพรวมก่อนปิดงาน", start: "21:00", end: "21:30" },
            ]);
            await seedEventSchedule(manager, event2, [
                { title: "เปิดทางเข้าและ Food Market", start: "16:00", end: "17:00" },
                { title: "วงนักศึกษาเปิดเวที", start: "17:00", end: "19:00" },
                { title: "การแสดงช่วงค่ำ", start: "19:00", end: "22:00" },
            ]);
            await seedEventSchedule(manager, event3, [
                { title: "ลงทะเบียนและรับป้ายชื่อ", start: "17:30", end: "18:15" },
                { title: "พบปะก่อนมื้อเย็น", start: "18:15", end: "19:00" },
                { title: "เสิร์ฟอาหารและเปิดวงสนทนา", start: "19:00", end: "20:15" },
                { title: "คุยต่อและแลกช่องทางติดต่อ", start: "20:15", end: "21:00" },
            ]);

            // ==========================================
            // 3. สร้าง Ticket Types (ราคาบัตรของแต่ละงาน)
            // ==========================================
            const [t1Early, t1Regular, t1Vip] = await manager.save([
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าสัมพันธ์ (Early Bird)",
                    description: "บัตรเข้างานราคาพิเศษสำหรับผู้จองล่วงหน้า (ไม่รวมเสื้อที่ระลึก)",
                    price: "350.00",
                    quota: 100,
                    sold: 45,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 1,
                    isActive: true,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.PHONE],
                }),
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าทั่วไป (Regular + เสื้อที่ระลึก)",
                    description: "บัตรเข้างานพร้อมรับเสื้อยืดที่ระลึก TUATUA Reunion 1 ตัว",
                    price: "500.00",
                    quota: 300,
                    sold: 120,
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                    sortOrder: 2,
                    isActive: true,
                    requiredFields: [
                        ATTENDEE_FIELDS.FIRST_NAME,
                        ATTENDEE_FIELDS.LAST_NAME,
                        ATTENDEE_FIELDS.PHONE,
                        ATTENDEE_FIELDS.GRADUATION_YEAR,
                    ],
                }),
                manager.create(EventTicket, {
                    eventId: event1.id,
                    name: "บัตรศิษย์เก่าสนับสนุน (VIP Front Table)",
                    description: "ที่นั่งโซนพิเศษหน้าเวที พร้อมเสื้อที่ระลึกและเครื่องดื่มต้อนรับ",
                    price: "1000.00",
                    quota: 50,
                    sold: 18,
                    minTicketQTY: 1,
                    maxTicketQTY: 5,
                    sortOrder: 3,
                    isActive: true,
                    requiredFields: [
                        ATTENDEE_FIELDS.FIRST_NAME,
                        ATTENDEE_FIELDS.LAST_NAME,
                        ATTENDEE_FIELDS.PHONE,
                        ATTENDEE_FIELDS.EMAIL,
                    ],
                }),
            ]);

            const [t2Standing] = await manager.save([
                manager.create(EventTicket, {
                    eventId: event2.id,
                    name: "Standing Zone B",
                    description: "บัตรยืนโซนมาตรฐาน",
                    price: "800.00",
                    quota: 500,
                    sold: 210,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 1,
                    isActive: true,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME],
                }),
                manager.create(EventTicket, {
                    eventId: event2.id,
                    name: "Standing Zone A (Front Stage)",
                    description: "บัตรยืนชิดขอบเวที",
                    price: "1500.00",
                    quota: 200,
                    sold: 95,
                    minTicketQTY: 1,
                    maxTicketQTY: 4,
                    sortOrder: 2,
                    isActive: true,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.PHONE],
                }),
                manager.create(EventTicket, {
                    eventId: event3.id,
                    name: "Standard Gala Seat",
                    description: "ที่นั่งร่วมงานดินเนอร์พร้อมชุดอาหารค่ำ",
                    price: "900.00",
                    quota: 150,
                    sold: 60,
                    minTicketQTY: 1,
                    maxTicketQTY: 2,
                    sortOrder: 1,
                    isActive: true,
                    requiredFields: [ATTENDEE_FIELDS.FIRST_NAME, ATTENDEE_FIELDS.LAST_NAME, ATTENDEE_FIELDS.EMAIL],
                }),
            ]);

            // ==========================================
            // ของที่ระลึกแยกจากงานและกำหนดสิทธิ์ได้ทีละรายการ
            const reunionShirt = await manager.save(manager.create(EventSouvenir, {
                eventId: event1.id,
                name: "เสื้อยืดที่ระลึก TUATUA Reunion 2026 (Oversize)",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
                sizes: ["S", "M", "L", "XL", "2XL"],
                extraPrice: "300.00",
            }));
            await seedSouvenirTicketTypes(manager, reunionShirt, [t1Regular, t1Vip]);
            const [reunionPin, , reunionKeychain] = await manager.save([
                manager.create(EventSouvenir, {
                    eventId: event1.id,
                    name: "เข็มกลัด TUATUA Reunion 2026",
                    allTicketTypes: true,
                }),
                manager.create(EventSouvenir, {
                    eventId: event3.id,
                    name: "กระบอกน้ำเก็บอุณหภูมิ Tech Alumni Edition",
                    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
                    sizes: ["One Size"],
                    allTicketTypes: true,
                    allowDecline: false,
                }),
                manager.create(EventSouvenir, {
                    eventId: event1.id,
                    name: "พวงกุญแจ TUATUA Reunion 2026",
                    extraPrice: "79.50",
                }),
            ]);

            const freeTicket = await seedCheckoutSalesExamples(manager, event2, seededAt);

            // ==========================================
            // 4. สร้าง Stores, Products & Store Wallets
            // ==========================================
            const store1 = await manager.save(
                manager.create(Store, {
                    eventId: event1.id,
                    name: "อาม่าหม่าล่า & ยากิโทริ",
                    description: "ปิ้งย่างหม่าล่าสูตรเสฉวนแท้ เผ็ดชาหอมเครื่องเทศ",
                    banner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
                })
            );

            const store2 = await manager.save(
                manager.create(Store, {
                    eventId: event1.id,
                    name: "ชื่นใจ Craft Soda & Mocktail",
                    description: "เครื่องดื่มคราฟต์โซดาผลไม้แท้ สดชื่นซ่าทุกแก้ว",
                    banner: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
                    thumbnail: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
                })
            );

            await manager.save([
                manager.create(Product, {
                    storeId: store1.id,
                    title: "เซ็ตหม่าล่ารวมมิตร 10 ไม้",
                    description: "หมูสามชั้น เนื้อโคขุน เห็ดออรินจิ และเบคอนพันไส้กรอก ย่างซอสหม่าล่าเข้มข้น",
                    price: "120.00",
                    images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"],
                }),
                manager.create(Product, {
                    storeId: store2.id,
                    title: "Yuzu Honey Sparkling Soda",
                    description: "โซดาส้มยูซุผสมน้ำผึ้งป่าเดือนห้า หอมหวานอมเปรี้ยว",
                    price: "65.00",
                    images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"],
                }),
            ]);

            const store1Wallet = await manager.save(manager.create(Wallet, { storeId: store1.id, total: "4560.00" }));
            const store2Wallet = await manager.save(manager.create(Wallet, { storeId: store2.id, total: "2925.00" }));

            // ==========================================
            // 5. กำหนด Roles & Permissions ให้ผู้ใช้ทั้งหมด
            // ==========================================
            const assignRole = async (
                user: User,
                role: Role,
                perms: Permission[],
                scope: { eventId?: string; storeId?: string } = {}
            ) => {
                const ur = await manager.save(
                    manager.create(UserRole, {
                        userId: user.id,
                        role,
                        eventId: scope.eventId ?? null,
                        storeId: scope.storeId ?? null,
                    })
                );
                if (perms.length > 0) {
                    await manager.save(
                        perms.map((permission) =>
                            manager.create(UserRolePermission, {
                                userRoleId: ur.id,
                                permission,
                            })
                        )
                    );
                }
            };

            const allPerms = Object.values(PERMISSIONS);
            await assignRole(savedUsers["admin@tuatua.com"], Role.ADMIN, allPerms);
            await assignRole(
                savedUsers["vendor1@tuatua.com"],
                Role.VENDOR,
                [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
                { eventId: event1.id, storeId: store1.id }
            );
            await assignRole(
                savedUsers["vendor2@tuatua.com"],
                Role.VENDOR,
                [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL],
                { eventId: event1.id, storeId: store2.id }
            );
            await assignRole(
                savedUsers["staff@tuatua.com"],
                Role.STAFF,
                [PERMISSIONS.TICKET_SCAN, PERMISSIONS.TOKEN_TOPUP, PERMISSIONS.REPORT_READ],
                { eventId: event1.id }
            );
            await assignRole(savedUsers["user1@tuatua.com"], Role.USER, []);
            await assignRole(savedUsers["user2@tuatua.com"], Role.USER, []);

            // ==========================================
            // 6. สร้าง Orders, OrderShipping & Tickets
            // ==========================================
            const user1 = savedUsers["user1@tuatua.com"];
            const user2 = savedUsers["user2@tuatua.com"];
            const staffUser = savedUsers["staff@tuatua.com"];

            // Order 1: User 1 ซื้อบัตร Regular 2 ใบ + จัดส่งเสื้อที่ระลึก (PAID)
            const order1 = await manager.save(
                manager.create(Order, {
                    orderNo: "ORD-20261109-001",
                    userId: user1.id,
                    eventId: event1.id,
                    total: "1050.00",
                    status: ORDER_STATUSES.PAID,
                    paymentSlip: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=500&q=80",
                    paidAt: new Date("2026-11-08T14:30:00+07:00"),
                    deliveryMethod: DELIVERY_METHODS.SHIPPING,
                    shippingFee: "50.00",
                })
            );

            await manager.save(
                manager.create(OrderShipping, {
                    orderId: order1.id,
                    recipientName: "รพีภัทร ศิษย์เก่าดีเด่น",
                    recipientPhone: "0855555555",
                    addressLine: "99/9 หมู่บ้านเทคโนวิลเลจ ถนนพหลโยธิน",
                    subDistrict: "เสนานิคม",
                    district: "จตุจักร",
                    province: "กรุงเทพมหานคร",
                    postalCode: "10900",
                    note: "ฝากไว้ที่นิติบุคคลได้เลยครับ",
                    status: SHIPPING_STATUSES.PREPARING,
                })
            );

            await manager.save([
                manager.create(Ticket, {
                    orderId: order1.id,
                    eventId: event1.id,
                    eventTicketId: t1Regular.id,
                    userId: user1.id,
                    unitPrice: "500.00",
                    ticketCode: "TKT-REU26-0001",
                    qrToken: "QR-DEMO-ACTIVE-001",
                    status: TICKET_STATUSES.ACTIVE,
                    firstName: "รพีภัทร",
                    lastName: "ศิษย์เก่าดีเด่น",
                    phone: "0855555555",
                    email: "user1@tuatua.com",
                    graduationYear: "2567",
                    souvenirItems: [{ souvenirId: reunionShirt.id, name: reunionShirt.name, size: "L" }],
                }),
                manager.create(Ticket, {
                    orderId: order1.id,
                    eventId: event1.id,
                    eventTicketId: t1Regular.id,
                    userId: user1.id,
                    unitPrice: "500.00",
                    ticketCode: "TKT-REU26-0002",
                    qrToken: "QR-DEMO-USED-002",
                    status: TICKET_STATUSES.USED,
                    firstName: "ณัฐวุฒิ",
                    lastName: "เพื่อนซี้ไอที",
                    phone: "0899999999",
                    email: "friend@tuatua.com",
                    graduationYear: "2567",
                    checkedInAt: new Date("2026-11-09T18:15:00+07:00"),
                    checkedInById: staffUser.id,
                    souvenirItems: [{ souvenirId: reunionShirt.id, name: reunionShirt.name, size: "XL" }],
                }),
            ]);

            // Order 2: User 2 ซื้อบัตร VIP 1 ใบ รับหน้างาน (PAID)
            const order2 = await manager.save(
                manager.create(Order, {
                    orderNo: "ORD-20261109-002",
                    userId: user2.id,
                    eventId: event1.id,
                    total: "1000.00",
                    status: ORDER_STATUSES.PAID,
                    paymentSlip: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=500&q=80",
                    paidAt: new Date("2026-11-09T10:00:00+07:00"),
                    deliveryMethod: DELIVERY_METHODS.PICKUP,
                    shippingFee: "0.00",
                })
            );

            await manager.save(
                manager.create(Ticket, {
                    orderId: order2.id,
                    eventId: event1.id,
                    eventTicketId: t1Vip.id,
                    userId: user2.id,
                    unitPrice: "1000.00",
                    ticketCode: "TKT-VIP26-0001",
                    qrToken: "QR-DEMO-VIP-001",
                    status: TICKET_STATUSES.ACTIVE,
                    firstName: "พิมพ์ชนก",
                    lastName: "ร่วมงานสนุก",
                    phone: "0866666666",
                    email: "user2@tuatua.com",
                    graduationYear: "2566",
                    souvenirItems: [{ souvenirId: reunionShirt.id, name: reunionShirt.name, size: "M" }],
                })
            );

            await seedCheckoutOrders(manager, {
                buyer: user1,
                earlyTicket: t1Early,
                regularTicket: t1Regular,
                standingTicket: t2Standing,
                freeTicket,
                shirt: reunionShirt,
                pin: reunionPin,
                keychain: reunionKeychain,
                reunionShippingFee: event1.shippingFee,
                seededAt,
            });

            // ==========================================
            // 7. สร้างประวัติธุรกรรมกระเป๋าเงิน (Wallet Histories)
            // ==========================================
            const u1Wallet = userWallets["user1@tuatua.com"];
            const u2Wallet = userWallets["user2@tuatua.com"];

            await manager.save([
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.TOPUP,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "2000.00",
                    before: "0.00",
                    after: "2000.00",
                    ref: staffUser.id,
                    note: "เติมเงินหน้างานจุดลงทะเบียน #1",
                }),
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "120.00",
                    before: "2000.00",
                    after: "1880.00",
                    ref: store1.id,
                    note: "ซื้อเซ็ตหม่าล่ารวมมิตร 10 ไม้",
                }),
                manager.create(WalletHistory, {
                    walletId: store1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "120.00",
                    before: "4440.00",
                    after: "4560.00",
                    ref: user1.id,
                    note: "รับชำระค่าสินค้าจากคุณรพีภัทร",
                }),
                manager.create(WalletHistory, {
                    walletId: u1Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "65.00",
                    before: "1880.00",
                    after: "1815.00",
                    ref: store2.id,
                    note: "ซื้อ Yuzu Honey Sparkling Soda",
                }),
                manager.create(WalletHistory, {
                    walletId: store2Wallet.id,
                    type: TRANSACTION_TYPES.PURCHASE,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "65.00",
                    before: "2860.00",
                    after: "2925.00",
                    ref: user1.id,
                    note: "รับชำระค่าเครื่องดื่มจากคุณรพีภัทร",
                }),
                manager.create(WalletHistory, {
                    walletId: u2Wallet.id,
                    type: TRANSACTION_TYPES.TOPUP,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "3500.00",
                    before: "0.00",
                    after: "3500.00",
                    ref: staffUser.id,
                    note: "เติมเงินผ่าน QR PromptPay",
                }),
                manager.create(WalletHistory, {
                    walletId: u2Wallet.id,
                    type: TRANSACTION_TYPES.REFUND,
                    status: TRANSACTION_STATUSES.COMPLETED,
                    amount: "300.00",
                    before: "3500.00",
                    after: "3200.00",
                    ref: savedUsers["admin@tuatua.com"].id,
                    note: "แลกคืนเงินสดหลังจบงาน",
                }),
            ]);

            // 8. งานและรายการเพิ่ม สำหรับลองตัวกรอง รายการยาว และบทบาทหลายขอบเขต
            const demoGuests = guests.map((guest) => savedUsers[guest.email]);
            for (const user of [...demoGuests, ...extraAccounts.slice(0, 3).map((account) => savedUsers[account.email])]) {
                await assignRole(user, Role.USER, []);
            }
            const demoEvents = await seedMoreEvents(manager, seededAt);
            const checkInStaff = savedUsers["demo-checkin@tuatua.com"];
            const topUpStaff = savedUsers["demo-topup@tuatua.com"];
            const refundStaff = savedUsers["demo-refund@tuatua.com"];
            await assignRole(checkInStaff, Role.STAFF, [PERMISSIONS.TICKET_SCAN]);
            await assignRole(topUpStaff, Role.STAFF, [PERMISSIONS.TOKEN_TOPUP]);
            await assignRole(refundStaff, Role.STAFF, [PERMISSIONS.TOKEN_REFUND_APPROVE]);
            await seedMoreOrders(manager, demoEvents, [user1, user2, ...demoGuests], checkInStaff, seededAt);

            const shops = await seedMoreStores(manager, demoEvents);
            for (const [index, { store, product }] of shops.entries()) {
                const permissions = product ? [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL] : [PERMISSIONS.STORE_MANAGE];
                await assignRole(savedUsers[vendors[index].email], Role.VENDOR, permissions, { eventId: store.eventId, storeId: store.id });
            }
            await seedMoreWalletActivity(manager, demoGuests, userWallets, shops, topUpStaff, refundStaff, seededAt);
        });

        console.log("✅ สร้างข้อมูล Mockup สำเร็จครบทุกตาราง!");
        console.log("--------------------------------------------------");
        console.log("🔑 บัญชีทดสอบ (รหัสผ่านทุกบัญชีคือ: password123)");
        console.log("   - Admin   : admin@tuatua.com");
        console.log("   - Vendor 1: vendor1@tuatua.com (ร้านอาม่าหม่าล่า)");
        console.log("   - Vendor 2: vendor2@tuatua.com (ร้านชื่นใจ Craft Soda)");
        console.log("   - Staff   : staff@tuatua.com");
        console.log("   - User 1  : user1@tuatua.com");
        console.log("   - User 2  : user2@tuatua.com");
        console.log("   - ผู้ใช้ตัวอย่างเพิ่มเติม: demo01@tuatua.com ถึง demo24@tuatua.com");
        console.log("   - บัญชีไม่มีออเดอร์หรือประวัติ Token: empty@tuatua.com");
        console.log("   - ร้านค้าตัวอย่าง: demo-vendor01@tuatua.com ถึง demo-vendor12@tuatua.com");
        console.log("   - เจ้าหน้าที่ตัวอย่าง: demo-checkin@tuatua.com, demo-topup@tuatua.com, demo-refund@tuatua.com");
        console.log("🎫 QR Token สำหรับทดสอบสแกนบัตรเข้างาน:");
        console.log("   - บัตรพร้อมใช้ : QR-DEMO-ACTIVE-001, QR-DEMO-VIP-001");
        console.log("   - บัตรใช้แล้ว  : QR-DEMO-USED-002");
        console.log("--------------------------------------------------");
    } finally {
        await migrationDataSource.destroy();
    }
}

runSeed().catch((error) => {
    console.error("❌ เกิดข้อผิดพลาดระหว่าง Seed ข้อมูล:", error);
    process.exit(1);
});
