S-MIS PORTAL - โครงสร้างแยกไฟล์
===================================
ไฟล์สำหรับ GitHub Pages:
index.html                   โครงสร้างหน้าเว็บและเมนู
assets/css/styles.css        CSS เดิมที่ย้ายออกจาก HTML
assets/js/config.js          URL API สำหรับเชื่อมต่อ Apps Script (เปิดเผยบนเว็บได้ ไม่ใช่ secret)
assets/js/login-ui.js        ตัวเลือกล็อกอินและ UI
assets/js/api.js             API client และค่าคงที่ร่วม
assets/js/permissions.js     การแสดงเมนูตามสิทธิ์
assets/js/session.js         การเก็บ/ตรวจอายุเซสชัน
assets/js/auth.js            ขั้นตอนล็อกอิน/ออกจากระบบ
assets/js/sso.js             SSO และการเปิดเมนูปลายทาง
assets/js/portal.js          การนำทางและเวลา/การเริ่มระบบ

ติดตั้ง: อัปโหลด index.html และโฟลเดอร์ assets ทั้งโครงสร้างไปยัง root ของ GitHub Pages
อย่าอัปโหลดเฉพาะ index.html เดี่ยว ๆ มิฉะนั้นหน้าเว็บจะใช้งานไม่ได้

Google Apps Script Code.gs ของ S-MIS PORTAL ไม่ได้นำมาลงใน ZIP
ให้เก็บไว้ฝั่ง Apps Script ตามเดิม รวมถึง Script Properties สำหรับเมนู A3/A4/B1/B2
ห้ามเผยแพร่ Code.gs, SSO shared secret, password salt หรือ token บน GitHub Pages

ไฟล์ชุดนี้เป็นการแยกโค้ดตามขอบเขตเดิม ไม่เปลี่ยนสิทธิ์เมนูหรือขั้นตอน SSO
ข้อจำกัด: การแยกโค้ดไม่ซ่อน URL/JavaScript ที่ browser จำเป็นต้องดาวน์โหลด
ให้ตรวจสิทธิ์ที่ Backend และทุกระบบปลายทางอย่างต่อเนื่อง

ตรวจไวยากรณ์ได้ด้วย node --check assets/js/*.js (แยกตรวจทีละไฟล์)
ควรทดสอบใน staging: login, user/admin permissions, A1/A2/A5 SSO, A3/A4/B1/B2 authorized URLs, logout, restore session
