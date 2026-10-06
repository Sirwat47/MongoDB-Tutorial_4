# Account Membership System

![Web Interface](./image/%E0%B8%AD%E0%B8%B4%E0%B8%94%E0%B8%8D%E0%B8%A7%E0%B8%9A.png)

ระบบจัดการ memberships ของผู้ใช้ที่ใช้ Express และ MongoDB

## รูปแบบการใช้งาน

### ติดตั้ง
```bash
npm install
```

### เริ่มต้น
```bash
npm start
# หรือ
node app.js
```
Server จะรันที่ `http://localhost:3000`

### ตั้งค่า
- ต้องมี MongoDB ผิดต่อที่ `mongodb://127.0.0.1:27017` ก่อน

## API Endpoints

### สมัคร-membership
- `POST /api/register` - ข้อมูล body: `username`, `email`, `password`

### เข้าสู่ระบบ
- `POST /api/login` - ข้อมูล body: `username`, `password`

### ดูผู้ใช้ทั้งหมด
- `GET /api/users` - คืนค่า array ของผู้ใช้ทั้งหมด

###  deletes account
- `DELETE /api/users/:username` -  deletes account ของผู้ใช้ที่ระบุ

## ข้อมูลผู้ใช้ที่บันทึก
- `username` - ไม่ซ้ำ
- `email` - ไม่ซ้ำ
- `passwordHash` - เข้ารูปด้วย bcrypt
- `loginCount` - จำนวนครั้งที่เข้าสู่ระบบ
- `createdAt`, `lastLogin`

## ขั้นตอนการตรวจสอบข้อมูลหลังจากเปิดใหม่
ข้อมูลจะเก็บใน MongoDB database `account-db` collection `users`
- เรียก `GET /api/users` เพื่อดูข้อมูลทั้งหมด
- หรือเปิด Compass แล้วเชื่อมต่อ `mongodb://127.0.0.1:27017`