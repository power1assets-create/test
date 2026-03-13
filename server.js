// ─── server.js ─────────────────────────────────────────────────────────────
// Express server สำหรับ Todo List App
// เก็บข้อมูลใน memory (array) — ไม่ต้องใช้ database
// ──────────────────────────────────────────────────────────────────────────

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000; // อ่าน port จาก env ก่อน, fallback 3000

// ─── In-Memory Data Store ──────────────────────────────────────────────────
let todos   = [];   // เก็บรายการ todo ทั้งหมด
let nextId  = 1;    // auto-increment id

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(express.json());                                        // parse JSON body
app.use(express.static(path.join(__dirname, 'public')));        // serve static files จาก /public

// ─── Routes ───────────────────────────────────────────────────────────────

// GET /api/todos — ดึง todo ทั้งหมด
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos — เพิ่ม todo ใหม่
// Body: { "text": "ข้อความ" }
app.post('/api/todos', (req, res) => {
  const { text } = req.body ?? {};

  // ตรวจสอบ input
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required' });
  }

  const todo = {
    id:        nextId++,
    text:      text.trim(),
    done:      false,               // เริ่มต้นยังไม่เสร็จ
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);       // 201 Created
});

// PUT /api/todos/:id — toggle done ↔ undone
app.put('/api/todos/:id', (req, res) => {
  const id   = parseInt(req.params.id, 10);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: `Todo id ${id} not found` });
  }

  todo.done = !todo.done;           // สลับสถานะ
  res.json(todo);
});

// DELETE /api/todos/:id — ลบ todo
app.delete('/api/todos/:id', (req, res) => {
  const id  = parseInt(req.params.id, 10);
  const idx = todos.findIndex(t => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: `Todo id ${id} not found` });
  }

  const [removed] = todos.splice(idx, 1);  // ตัดออกจาก array
  res.json({ message: 'Deleted', todo: removed });
});

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
});
