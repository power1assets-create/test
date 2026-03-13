// ─────────────────────────────────────────────────────────────
//  app.js  — Todo List client
//  ใช้ fetch() ล้วนๆ ไม่มี library
// ─────────────────────────────────────────────────────────────

// ─── DOM refs ────────────────────────────────────────────────
const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const todoList   = document.getElementById('todo-list');
const summary    = document.getElementById('summary');
const filterBtns = document.querySelectorAll('.filter-btn');

// ─── State ───────────────────────────────────────────────────
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ─────────────────────────────────────────────────────────────
//  API layer
// ─────────────────────────────────────────────────────────────

// GET /api/todos → ดึงรายการทั้งหมด แล้ว render
async function loadTodos() {
  try {
    const res   = await fetch('/api/todos');
    const todos = await res.json();
    renderList(todos);
    updateSummary(todos);
  } catch (err) {
    showError('โหลดข้อมูลล้มเหลว กรุณารีเฟรช');
  }
}

// POST /api/todos → เพิ่ม todo ใหม่ แล้ว refresh
async function addTodo() {
  const text = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch('/api/todos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      return showError(error);
    }

    input.value = ''; // ล้าง input หลังเพิ่มสำเร็จ
    await loadTodos();
  } catch {
    showError('เพิ่ม todo ล้มเหลว');
  }
}

// PUT /api/todos/:id → toggle done/undone แล้ว refresh
async function toggleTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'PUT' });

    if (!res.ok) {
      const { error } = await res.json();
      return showError(error);
    }

    await loadTodos();
  } catch {
    showError('อัปเดต todo ล้มเหลว');
  }
}

// DELETE /api/todos/:id → ลบ todo แล้ว refresh
async function deleteTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const { error } = await res.json();
      return showError(error);
    }

    await loadTodos();
  } catch {
    showError('ลบ todo ล้มเหลว');
  }
}

// ─────────────────────────────────────────────────────────────
//  Render
// ─────────────────────────────────────────────────────────────

// วาดรายการ todo ลงใน <ul> ตาม filter ปัจจุบัน
function renderList(todos) {
  const filtered = todos.filter((t) => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
  });

  todoList.innerHTML = '';

  if (filtered.length === 0) {
    todoList.innerHTML =
      '<li class="text-center text-gray-600 py-10 text-sm select-none">ไม่มีรายการ</li>';
    return;
  }

  filtered.forEach((todo) => todoList.appendChild(createItem(todo)));
}

// อัปเดตข้อความนับจำนวน task ที่ยังไม่เสร็จ
function updateSummary(todos) {
  const remaining = todos.filter((t) => !t.done).length;
  const total     = todos.length;
  summary.textContent =
    total === 0
      ? 'ยังไม่มีรายการ'
      : `เหลือ ${remaining} / ${total} รายการที่ยังไม่เสร็จ`;
}

// สร้าง <li> element หนึ่งรายการ
function createItem(todo) {
  const li = document.createElement('li');
  li.className = [
    'todo-item flex items-center gap-3 px-4 py-3 rounded-xl',
    'bg-gray-800 border border-gray-700',
    todo.done ? 'opacity-50' : '',
  ].join(' ');

  // Checkbox — toggle done/undone
  const checkbox       = document.createElement('input');
  checkbox.type        = 'checkbox';
  checkbox.checked     = todo.done;
  checkbox.className   = 'w-4 h-4 accent-indigo-500 cursor-pointer flex-shrink-0';
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  // ข้อความ task
  const span         = document.createElement('span');
  span.textContent   = todo.text;
  span.className     = [
    'flex-1 text-sm break-words',
    todo.done ? 'line-through text-gray-500' : 'text-gray-100',
  ].join(' ');

  // ปุ่มลบ
  const del         = document.createElement('button');
  del.textContent   = '✕';
  del.title         = 'ลบรายการนี้';
  del.className     = [
    'flex-shrink-0 text-gray-600 hover:text-red-400',
    'transition-colors duration-150 text-lg leading-none cursor-pointer',
  ].join(' ');
  del.addEventListener('click', () => deleteTodo(todo.id));

  li.append(checkbox, span, del);
  return li;
}

// แสดง error toast เล็กๆ ที่ด้านบน (หายเองใน 3 วิ)
function showError(msg) {
  const toast = document.createElement('div');
  toast.textContent = `⚠ ${msg}`;
  toast.className = [
    'fixed top-4 left-1/2 -translate-x-1/2 z-50',
    'bg-red-900 border border-red-600 text-red-200',
    'text-sm px-4 py-2 rounded-lg shadow-lg',
    'transition-opacity duration-300',
  ].join(' ');
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─────────────────────────────────────────────────────────────
//  Event Listeners
// ─────────────────────────────────────────────────────────────

// ปุ่ม "เพิ่ม"
addBtn.addEventListener('click', addTodo);

// กด Enter ใน input
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ปุ่ม filter — อัปเดต Tailwind classes + re-render
const ACTIVE   = ['bg-indigo-600', 'border-indigo-500', 'text-white'];
const INACTIVE = ['bg-gray-800',   'border-gray-700',   'text-gray-400'];

filterBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    filterBtns.forEach((b) => {
      b.classList.remove(...ACTIVE);
      b.classList.add(...INACTIVE);
    });
    btn.classList.remove(...INACTIVE);
    btn.classList.add(...ACTIVE);

    currentFilter = btn.dataset.filter;
    await loadTodos(); // fetch ใหม่แล้ว render ตาม filter
  });
});

// ─────────────────────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────────────────────
loadTodos();
