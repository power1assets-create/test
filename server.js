// นำเข้า Express framework
const express = require('express');
const path = require('path');

// สร้าง Express application
const app = express();

// กำหนด PORT จาก environment variable หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// แปลง request body ที่เป็น JSON ให้อ่านได้
app.use(express.json());

// Serve static files (HTML, CSS, JS) จากโฟลเดอร์ /public
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory data store ---
// เก็บรายการ Todo ไว้ใน array (รีเซ็ตทุกครั้งที่ server restart)
let todos = [];
let nextId = 1; // ตัวนับ ID อัตโนมัติ

// --- API Routes ---

// GET /api/todos — ดึงรายการ Todo ทั้งหมด
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos — เพิ่ม Todo ใหม่
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่ามีข้อความหรือไม่
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const todo = {
    id: nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — สลับสถานะ completed ของ Todo
app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // สลับสถานะ เสร็จ/ยังไม่เสร็จ
  todo.completed = !todo.completed;
  res.json(todo);
});

// DELETE /api/todos/:id — ลบ Todo ตาม ID
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send(); // 204 No Content = ลบสำเร็จ ไม่มี body
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
