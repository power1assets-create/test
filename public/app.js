// ─────────────────────────────────────────────────────────────
//  app.js  — Todo List client  (TailAdmin dashboard layout)
//  ใช้ fetch() ล้วนๆ ไม่มี library
// ─────────────────────────────────────────────────────────────

// ─── DOM refs ────────────────────────────────────────────────
const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const todoList   = document.getElementById('todo-list');
const summary    = document.getElementById('summary');
const filterBtns = document.querySelectorAll('.filter-btn');

// stat cards
const statTotal   = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statDone    = document.getElementById('stat-done');
const sidebarBadge = document.getElementById('sidebar-badge');

// ─── State ───────────────────────────────────────────────────
let currentFilter = 'all';

// ─────────────────────────────────────────────────────────────
//  API layer
// ─────────────────────────────────────────────────────────────

async function loadTodos() {
  try {
    const res   = await fetch('/api/todos');
    const todos = await res.json();
    renderList(todos);
    updateStats(todos);
  } catch {
    showToast('โหลดข้อมูลล้มเหลว กรุณารีเฟรช', 'error');
  }
}

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
      return showToast(error, 'error');
    }

    input.value = '';
    await loadTodos();
  } catch {
    showToast('เพิ่ม task ล้มเหลว', 'error');
  }
}

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

// ─────────────────────────────────────────────────────────────
//  Render
// ─────────────────────────────────────────────────────────────

function renderList(todos) {
  const filtered = todos.filter((t) => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
  });

  todoList.innerHTML = '';

  if (filtered.length === 0) {
    todoList.innerHTML = `
      <li class="flex flex-col items-center justify-center py-14 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
               M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p class="text-sm">ไม่มีรายการ</p>
      </li>`;
    return;
  }

  filtered.forEach((todo) => todoList.appendChild(createRow(todo)));
}

// สร้าง <li> แบบ table row
function createRow(todo) {
  const li = document.createElement('li');
  li.className = 'todo-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-6 py-3.5';

  // ── Task text + checkbox ──
  const taskCell = document.createElement('div');
  taskCell.className = 'flex items-center gap-3 min-w-0';

  const checkbox     = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.checked   = todo.done;
  checkbox.className = 'w-4 h-4 rounded cursor-pointer flex-shrink-0';
  checkbox.style.accentColor = '#465FFF';
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const textSpan       = document.createElement('span');
  textSpan.textContent = todo.text;
  textSpan.className   = [
    'text-sm truncate',
    todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium',
  ].join(' ');

  taskCell.append(checkbox, textSpan);

  // ── Status badge ──
  const badge       = document.createElement('span');
  badge.textContent = todo.done ? 'Done' : 'Pending';
  badge.className   = [
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
    todo.done
      ? 'bg-emerald-50 text-emerald-600'
      : 'text-amber-600',
  ].join(' ');
  if (!todo.done) badge.style.background = '#fffbeb';

  // ── Delete button ──
  const del       = document.createElement('button');
  del.title       = 'ลบ';
  del.className   = 'p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer';
  del.innerHTML   = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
         7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>`;
  del.addEventListener('click', () => deleteTodo(todo.id));

  li.append(taskCell, badge, del);
  return li;
}

// อัปเดต stat cards + sidebar badge + summary text
function updateStats(todos) {
  const total   = todos.length;
  const done    = todos.filter((t) => t.done).length;
  const pending = total - done;

  statTotal.textContent   = total;
  statPending.textContent = pending;
  statDone.textContent    = done;
  sidebarBadge.textContent = pending;

  summary.textContent = total === 0
    ? 'ยังไม่มีรายการ'
    : `${pending} รายการที่ยังไม่เสร็จ จาก ${total} ทั้งหมด`;
}

// Toast notification (แทน alert)
function showToast(msg, type = 'error') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const colors = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-sm text-sm ${colors}`;
  toast.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <span>${msg}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─────────────────────────────────────────────────────────────
//  Filter buttons — อัปเดต active state
// ─────────────────────────────────────────────────────────────
filterBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    filterBtns.forEach((b) => {
      b.classList.remove('bg-blue-50', 'font-semibold');
      b.style.color = '';
    });
    btn.classList.add('bg-blue-50', 'font-semibold');
    btn.style.color = '#465FFF';

    currentFilter = btn.dataset.filter;
    await loadTodos();
  });
});

// ─────────────────────────────────────────────────────────────
//  Event Listeners
// ─────────────────────────────────────────────────────────────
addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

// ─────────────────────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────────────────────
loadTodos();
