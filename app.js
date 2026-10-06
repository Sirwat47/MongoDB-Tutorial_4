const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "account-db";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let usersCollection;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(DB_NAME);
  usersCollection = db.collection("users");

  await usersCollection.createIndex({ username: 1 }, { unique: true });
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  console.log("เชื่อมต่อ MongoDB สำเร็จ:", MONGO_URI, "| ฐานข้อมูล:", DB_NAME);

  app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
  });
}

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอก username, email และ password ให้ครบถ้วน" });
    }
    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "ข้อมูลต้องอยู่ในรูปแบบข้อความ" });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: "username ต้องมีอย่างน้อย 3 ตัวอักษร" });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "รูปแบบ email ไม่ถูกต้อง" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "password ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const duplicate = await usersCollection.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });
    if (duplicate) {
      const field = duplicate.username === cleanUsername ? "username" : "email";
      return res.status(409).json({ success: false, message: `${field} นี้มีผู้ใช้งานแล้ว` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await usersCollection.insertOne({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      loginCount: 0,
      createdAt: now,
      lastLogin: null
    });

    return res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      user: { id: result.insertedId, username: cleanUsername, email: cleanEmail }
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const field = err.keyPattern && err.keyPattern.email ? "email" : "username";
      return res.status(409).json({ success: false, message: `${field} นี้มีผู้ใช้งานแล้ว` });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอก username และ password" });
    }

    const user = await usersCollection.findOne({ username: String(username).trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "username หรือ password ไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "username หรือ password ไม่ถูกต้อง" });
    }

    await usersCollection.updateOne(
      { _id: user._id },
      { $inc: { loginCount: 1 }, $set: { lastLogin: new Date() } }
    );

    const updated = await usersCollection.findOne(
      { _id: user._id },
      { projection: { passwordHash: 0 } }
    );

    return res.json({ success: true, message: "เข้าสู่ระบบสำเร็จ", user: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await usersCollection
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.delete("/api/users/:username", async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();
    const result = await usersCollection.deleteOne({ username });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งานนี้" });
    }
    return res.json({ success: true, message: "ลบบัญชีผู้ใช้เรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

main().catch((err) => {
  console.error("เชื่อมต่อ MongoDB ไม่สำเร็จ:", err.message);
  process.exit(1);
});
