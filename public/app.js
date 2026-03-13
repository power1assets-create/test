// ═══════════════════════════════════════════════════════════════
//  app.js — Todo List client
//  ใช้ fetch() ล้วนๆ ไม่มี library
//
//  ┌─ API layer ──────────────────────────────────────────────┐
//  │  loadTodos()      GET    /api/todos        → render      │
//  │  addTodo()        POST   /api/todos        → refresh     │
//  │  toggleTodo(id)   PUT    /api/todos/:id    → refresh     │
//  │  deleteTodo(id)   DELETE /api/todos/:id    → refresh     │
//  └──────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
//  DOM refs
// ───────────────────────────────────────────────────────────────
const input        = document.getElementById('todo-input');
const addBtn       = document.getElementById('add-btn');
const todoList     = document.getElementById('todo-list');
const summary      = document.getElementById('summary');
const filterBtns   = document.querySelectorAll('.filter-btn');
const statTotal    = document.getElementById('stat-total');
const statPending  = document.getElementById('stat-pending');
const statDone     = document.getElementById('stat-done');
const sidebarBadge = document.getElementById('sidebar-badge');

// ───────────────────────────────────────────────────────────────
//  State
// ───────────────────────────────────────────────────────────────
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ═══════════════════════════════════════════════════════════════
//  API layer
// ═══════════════════════════════════════════════════════════════

// GET /api/todos
// ดึงรายการทั้งหมด → render list + อัปเดต stats
async function loadTodos() {
  try {
    const res   = await fetch('/api/todos');
    const todos = await res.json();

    renderList(todos);   // วาดรายการใน <ul>
    updateStats(todos);  // อัปเดต stat cards + summary
  } catch {
    showToast('โหลดข้อมูลล้มเหลว กรุณารีเฟรช', 'error');
  }
}

// POST /api/todos  body: { text }
// เพิ่ม todo ใหม่ → ล้าง input → refresh
async function addTodo() {
  const text = input.value.trim();
  if (!text) return; // ไม่ทำอะไรถ้า input ว่าง

  try {
    const res = await fetch('/api/todos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      return showToast(error, 'error');
    }

    input.value = ''; // ล้าง input หลังเพิ่มสำเร็จ
    await loadTodos();
  } catch {
    showToast('เพิ่ม task ล้มเหลว', 'error');
  }
}

// PUT /api/todos/:id
// toggle done ↔ undone → refresh
async function toggleTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'PUT' });

    if (!res.ok) {
      const { error } = await res.json();
      return showToast(error, 'error');
    }

    await loadTodos();
  } catch {
    showToast('อัปเดต task ล้มเหลว', 'error');
  }
}

// DELETE /api/todos/:id
// ลบ todo → refresh
async function deleteTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const { error } = await res.json();
      return showToast(error, 'error');
    }

    await loadTodos();
  } catch {
    showToast('ลบ task ล้มเหลว', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  Render layer
// ═══════════════════════════════════════════════════════════════

// วาดรายการ todo ลงใน <ul> ตาม currentFilter
function renderList(todos) {
  const filtered = todos.filter((t) => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true; // 'all'
  });

  todoList.innerHTML = '';

  if (filtered.length === 0) {
    todoList.innerHTML = `
      <li class="flex flex-col items-center justify-center py-14 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
               00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p class="text-sm">ไม่มีรายการ</p>
      </li>`;
    return;
  }

  // วาดแต่ละ row
  filtered.forEach((todo) => todoList.appendChild(createRow(todo)));
}

// สร้าง <li> หนึ่ง row สำหรับ todo รายการหนึ่ง
function createRow(todo) {
  const li = document.createElement('li');
  li.className = 'todo-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-6 py-3.5';

  // ── ① Checkbox + ข้อความ ──────────────────────────────────
  const taskCell     = document.createElement('div');
  taskCell.className = 'flex items-center gap-3 min-w-0';

  const checkbox           = document.createElement('input');
  checkbox.type            = 'checkbox';
  checkbox.checked         = todo.done;
  checkbox.className       = 'w-4 h-4 rounded cursor-pointer flex-shrink-0';
  checkbox.style.accentColor = '#a29bfe'; // สีม่วงรุ้ง
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const text           = document.createElement('span');
  text.textContent     = todo.text;
  text.className       = [
    'text-sm truncate',
    todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium',
  ].join(' ');

  taskCell.append(checkbox, text);

  // ── ② Status badge ────────────────────────────────────────
  const badge           = document.createElement('span');
  badge.textContent     = todo.done ? 'Done' : 'Pending';
  badge.className       = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap';
  badge.style.cssText   = todo.done
    ? 'background:#d1fae5; color:#059669;'   // เขียว Done
    : 'background:#fef9c3; color:#b45309;';  // เหลือง Pending

  // ── ③ ปุ่มลบ ──────────────────────────────────────────────
  const del         = document.createElement('button');
  del.title         = 'ลบ';
  del.className     = 'p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer';
  del.innerHTML     = `
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
           01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
           00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>`;
  del.addEventListener('click', () => deleteTodo(todo.id));

  li.append(taskCell, badge, del);
  return li;
}

// อัปเดต stat cards, sidebar badge, และ summary text
// เรียกหลัง API ทุกครั้งเพื่อให้ตัวเลขสดเสมอ
function updateStats(todos) {
  const total   = todos.length;
  const done    = todos.filter((t) => t.done).length;
  const pending = total - done;

  statTotal.textContent    = total;
  statPending.textContent  = pending;
  statDone.textContent     = done;
  sidebarBadge.textContent = pending;

  summary.textContent = total === 0
    ? 'ยังไม่มีรายการ'
    : `${pending} รายการที่ยังไม่เสร็จ จาก ${total} ทั้งหมด`;
}

// ═══════════════════════════════════════════════════════════════
//  UI helpers
// ═══════════════════════════════════════════════════════════════

// Toast notification — ขึ้นที่มุมขวาบน หายเองใน 3 วิ
function showToast(msg, type = 'error') {
  const container = document.getElementById('toast-container');

  const colors = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-600'
    : 'bg-violet-50 border-violet-200 text-violet-700';

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-sm text-sm ${colors}`;
  toast.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <span>${msg}</span>`;

  container.appendChild(toast);

  // fade out แล้วลบ
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity    = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════
//  Event Listeners
// ═══════════════════════════════════════════════════════════════

// ปุ่ม "+ เพิ่ม"
addBtn.addEventListener('click', addTodo);

// กด Enter ใน input field
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ปุ่ม filter (ทั้งหมด / ยังไม่เสร็จ / เสร็จแล้ว)
filterBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    // reset ทุกปุ่ม
    filterBtns.forEach((b) => {
      b.classList.remove('text-white', 'font-semibold');
      b.classList.add('text-white/50');
    });
    // active ปุ่มที่คลิก
    btn.classList.remove('text-white/50');
    btn.classList.add('text-white', 'font-semibold');

    currentFilter = btn.dataset.filter;
    await loadTodos(); // fetch ใหม่แล้ว render ตาม filter
  });
});

// ═══════════════════════════════════════════════════════════════
//  Init — โหลด todo ครั้งแรกเมื่อหน้าเว็บพร้อม
// ═══════════════════════════════════════════════════════════════
loadTodos();
