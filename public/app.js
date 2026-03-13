// ============================================================
//  app.js — Client-side logic สำหรับ Todo List App
//  ติดต่อกับ server ผ่าน Fetch API (REST)
// ============================================================

// --- State ---
let todos = [];           // เก็บรายการ Todo ทั้งหมดที่ดึงมาจาก server
let currentFilter = 'all'; // filter ที่กำลังใช้งาน: 'all' | 'active' | 'completed'

// --- DOM References ---
const input     = document.getElementById('todo-input');
const addBtn    = document.getElementById('add-btn');
const todoList  = document.getElementById('todo-list');
const summary   = document.getElementById('summary');
const filterBtns = document.querySelectorAll('.filter-btn');

// ============================================================
//  API Helpers — ฟังก์ชันสำหรับเรียก REST API
// ============================================================

// ดึงรายการ Todo ทั้งหมดจาก server
async function fetchTodos() {
  const res = await fetch('/api/todos');
  todos = await res.json();
  render();
}

// เพิ่ม Todo ใหม่
async function addTodo(text) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    return;
  }

  const newTodo = await res.json();
  todos.push(newTodo); // เพิ่มลงใน local state โดยไม่ต้อง fetch ใหม่
  render();
}

// สลับสถานะ completed ของ Todo ตาม id
async function toggleTodo(id) {
  const res = await fetch(`/api/todos/${id}`, { method: 'PUT' });
  if (!res.ok) return;

  const updated = await res.json();
  // อัปเดต local state
  todos = todos.map((t) => (t.id === updated.id ? updated : t));
  render();
}

// ลบ Todo ตาม id
async function deleteTodo(id) {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) return;

  // กรอง Todo ที่ถูกลบออกจาก local state
  todos = todos.filter((t) => t.id !== id);
  render();
}

// ============================================================
//  Render — สร้าง UI จาก state ปัจจุบัน
// ============================================================

function render() {
  // กรองรายการตาม filter ที่เลือก
  const filtered = todos.filter((t) => {
    if (currentFilter === 'active')    return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true; // 'all'
  });

  // ล้าง list เก่าก่อนวาดใหม่
  todoList.innerHTML = '';

  if (filtered.length === 0) {
    // แสดง empty state
    todoList.innerHTML =
      '<li class="text-center text-gray-600 py-10 text-sm">ไม่มีรายการ</li>';
  } else {
    filtered.forEach((todo) => {
      const li = createTodoElement(todo);
      todoList.appendChild(li);
    });
  }

  // อัปเดตสรุปจำนวน
  const remaining = todos.filter((t) => !t.done).length;
  summary.textContent = `เหลือ ${remaining} รายการที่ยังไม่เสร็จ จากทั้งหมด ${todos.length} รายการ`;
}

// สร้าง <li> element สำหรับ Todo หนึ่งรายการ (Tailwind dark theme)
function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className = [
    'todo-item flex items-center gap-3 px-4 py-3 rounded-xl',
    'bg-gray-800 border border-gray-700',
    todo.done ? 'opacity-50' : '',
  ].join(' ');

  // Checkbox สำหรับสลับสถานะ
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'w-4 h-4 accent-indigo-500 cursor-pointer flex-shrink-0';
  checkbox.checked = todo.done;
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  // ข้อความ
  const span = document.createElement('span');
  span.className = [
    'flex-1 text-sm break-words',
    todo.done ? 'line-through-text text-gray-500' : 'text-gray-100',
  ].join(' ');
  span.textContent = todo.text;

  // ปุ่มลบ
  const deleteBtn = document.createElement('button');
  deleteBtn.className = [
    'flex-shrink-0 text-gray-600 hover:text-red-400',
    'transition-colors duration-150 text-lg leading-none cursor-pointer',
  ].join(' ');
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'ลบรายการนี้';
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);
  return li;
}

// ============================================================
//  Event Listeners
// ============================================================

// คลิกปุ่ม "เพิ่ม"
addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = ''; // ล้าง input หลังเพิ่ม
});

// กด Enter ใน input field
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// คลิกปุ่ม filter
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    // เปลี่ยน active class
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.dataset.filter;
    render(); // วาด UI ใหม่ตาม filter
  });
});

// ============================================================
//  Init — โหลดข้อมูลครั้งแรกเมื่อหน้าเว็บพร้อม
// ============================================================
fetchTodos();
