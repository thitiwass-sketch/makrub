# 🙋‍♂️ MaKrubNRRU (ระบบเช็คชื่อ "มาครับ" NRRU)

**MaKrubNRRU** เป็นเว็บแอปพลิเคชันสำหรับการบันทึกและจัดการการเข้าเรียน/เช็คชื่อ (Class Attendance Management System) ออกแบบมาเพื่ออำนวยความสะดวกให้แก่นักศึกษาและอาจารย์ผู้สอน มหาวิทยาลัยราชภัฏนครราชสีมา (NRRU)

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* **Frontend:** [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Runtime & Package Manager:** [Bun](https://bun.sh/)
* **Backend / Server:** TypeScript (`server.ts`)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
makrub/
├── public/assets/              # ไฟล์สื่อและ static assets (โลโก้, รูปภาพประกอบ)
├── src/                        # ซอร์สโค้ดหลัก (React Components, Pages, Hooks)
├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
├── .gitignore                  # รายการไฟล์ที่ไม่ต้องอัปโหลดขึ้น Git
├── bun.lock                    # ไฟล์ Lock dependencies ของ Bun
├── index.html                  # ไฟล์ HTML หลักสำหรับแสดงผลแอปพลิเคชัน
├── metadata.json               # รายละเอียด Metadata ของโปรเจกต์
├── package.json                # รายชื่อ Dependencies และ Scripts
├── server.ts                   # เซิร์ฟเวอร์หลัก (TypeScript / Bun Server)
└── tsconfig.json               # การตั้งค่า TypeScript Compiler
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
เครื่องของคุณต้องติดตั้ง **Bun** เรียบร้อยแล้ว (หากยังไม่ได้ติดตั้ง สามารถรันคำสั่งด้านล่าง):
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. ดาวน์โหลดโปรเจกต์ (Clone Repository)
```bash
git clone https://github.com/thitiwass-sketch/makrub.git
cd makrub
```

### 3. ติดตั้ง Dependencies
```bash
bun install
```

### 4. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` ไปเป็น `.env` แล้วระบุค่าคอนฟิกต่าง ๆ ตามต้องการ:
```bash
cp .env.example .env
```

### 5. การรันแอปพลิเคชัน (Running the Project)

* **รันในโหมดพัฒนา (Development Mode):**
  ```bash
  bun run dev
  ```
* **รัน Backend Server:**
  ```bash
  bun server.ts
  ```
* **สร้างไฟล์สำหรับ Production (Build):**
  ```bash
  bun run build
  ```

---

## 👥 ผู้พัฒนา (Contributors)

* **Thitiwass** ([@thitiwass-sketch](https://github.com/thitiwass-sketch))

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้จัดทำขึ้นเพื่อการใช้งานและพัฒนาภายใน **มหาวิทยาลัยราชภัฏนครราชสีมา (NRRU)**
