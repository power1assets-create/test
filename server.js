require('dotenv').config(); // โหลด .env ก่อนทุกอย่าง

const express = require('express');
const path    = require('path');
const pool    = require('./db');  // PostgreSQL pool

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helper ────────────────────────────────────────────────────
function parseId(param) {
  const id = parseInt(param, 10);
  return Number.isNaN(id) ? null : id;
}

// ─── Routes ────────────────────────────────────────────────────

// GET /api/todos — ดึงทั้งหมด เรียงใหม่สุดก่อน
app.get('/api/todos', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, text, done, created_at AS "createdAt", updated_at AS "updatedAt" FROM todos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/todos — เพิ่ม todo ใหม่
app.post('/api/todos', async (req, res, next) => {
  try {
    const { text } = req.body ?? {};

    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text is required and must be a non-empty string' });
    }

    const { rows } = await pool.query(
      `INSERT INTO todos (text) VALUES ($1)
       RETURNING id, text, done, created_at AS "createdAt"`,
      [text.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/todos/:id — toggle done ↔ undone
app.put('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'id must be a number' });

    const { rows } = await pool.query(
      `UPDATE todos
       SET done = NOT done, updated_at = NOW()
       WHERE id = $1
       RETURNING id, text, done, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: `Todo id ${id} not found` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/todos/:id — ลบ todo
app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'id must be a number' });

    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING id, text, done',
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: `Todo id ${id} not found` });
    res.json({ message: 'Deleted', todo: rows[0] });
  } catch (err) { next(err); }
});

// ─── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
