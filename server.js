const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory store ───────────────────────────────────────────
let todos  = [];
let nextId = 1;

// ─── Helper ────────────────────────────────────────────────────
// แปลง :id param เป็น integer และตรวจว่าถูกต้อง
function parseId(param) {
  const id = parseInt(param, 10);
  return Number.isNaN(id) ? null : id;
}

// ─── Routes ────────────────────────────────────────────────────

// GET /api/todos
// คืน todo ทั้งหมด เรียงจากใหม่ → เก่า
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos
// body: { text: string }
// สร้าง todo ใหม่ คืน 201 + object ที่สร้าง
app.post('/api/todos', (req, res) => {
  const { text } = req.body ?? {};

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  const todo = {
    id:        nextId++,
    text:      text.trim(),
    done:      false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(todo); // เพิ่มที่ต้น array ให้แสดงใหม่สุดก่อน
  res.status(201).json(todo);
});

// PUT /api/todos/:id
// toggle done ↔ undone คืน todo ที่อัปเดตแล้ว
app.put('/api/todos/:id', (req, res) => {
  const id   = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: `Todo id ${id} not found` });
  }

  todo.done      = !todo.done;
  todo.updatedAt = new Date().toISOString();
  res.json(todo);
});

// DELETE /api/todos/:id
// ลบ todo คืน object ที่ถูกลบ (ให้ client ยืนยันได้)
app.delete('/api/todos/:id', (req, res) => {
  const id    = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Todo id ${id} not found` });
  }

  const [deleted] = todos.splice(index, 1);
  res.json({ message: 'Deleted', todo: deleted });
});

// ─── 404 handler (route ที่ไม่มีในระบบ) ───────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ──────────────────────────────────────
// รับ error ที่หลุดจาก route handlers (next(err))
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
