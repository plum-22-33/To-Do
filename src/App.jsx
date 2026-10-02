import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Plus, Search, Trash2, X } from "lucide-react";

/* ---------- config ---------- */
const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", bar: "bg-emerald-400" },
  medium: { label: "ปานกลาง", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", bar: "bg-orange-400" },
  high: { label: "สูง", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", bar: "bg-rose-500" },
};
const NEXT_PRIORITY = { low: "medium", medium: "high", high: "low" };

const CATEGORIES = {
  work: { label: "งาน", tag: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", dot: "bg-sky-500" },
  personal: { label: "ส่วนตัว", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", dot: "bg-violet-500" },
  shopping: { label: "ช้อปปิ้ง", tag: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300", dot: "bg-pink-500" },
  health: { label: "สุขภาพ", tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300", dot: "bg-teal-500" },
};

const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];

/* ---------- date helpers ---------- */
const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const formatDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });

// "overdue" | "today" | "upcoming" | null (no due date, or already done)
const dueStatus = (todo, today) => {
  if (!todo.due || todo.done) return null;
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  return "upcoming";
};

const DUE_STYLE = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  today: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  upcoming: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
};

/* ---------- donut chart ---------- */
function Donut({ segments, total, percent }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label="สัดส่วนสถานะงาน">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="12" className="stroke-gray-200 dark:stroke-zinc-700" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el =
              s.value > 0 ? (
                <circle
                  key={s.key}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="12"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  className={`${s.stroke} transition-all duration-500`}
                />
              ) : null;
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800 dark:text-zinc-100 leading-none">{percent}%</span>
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">เสร็จแล้ว</span>
      </div>
    </div>
  );
}

/* ---------- todo item ---------- */
function TodoItem({ todo, today, onToggle, onDelete, onEdit, onCycle }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const t = draft.trim();
    if (t) onEdit(todo.id, t);
    else setDraft(todo.text);
    setEditing(false);
  };

  const p = PRIORITIES[todo.priority];
  const c = CATEGORIES[todo.category];
  const ds = dueStatus(todo, today);
  const dueText = !todo.due
    ? ""
    : ds === "overdue"
    ? `เลยกำหนด · ${formatDate(todo.due)}`
    : ds === "today"
    ? "วันนี้"
    : formatDate(todo.due);

  return (
    <li className={`todo-item mb-2 ${todo.removing ? "removing" : ""}`}>
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden pr-2">
        <span className={`self-stretch w-1.5 shrink-0 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label="ทำเครื่องหมายว่าเสร็จ"
          className={`ml-1 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
            todo.done
              ? "bg-indigo-500 border-indigo-500 text-white"
              : "border-gray-300 dark:border-zinc-600 hover:border-indigo-400"
          }`}
        >
          {todo.done && <Check size={16} />}
        </button>

        <div className="flex-1 min-w-0 py-3">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setDraft(todo.text);
                  setEditing(false);
                }
              }}
              className="w-full bg-transparent border-b-2 border-indigo-400 outline-none text-gray-800 dark:text-zinc-100"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setDraft(todo.text);
                setEditing(true);
              }}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none ${
                todo.done ? "line-through text-gray-400 dark:text-zinc-500" : "text-gray-800 dark:text-zinc-100"
              }`}
            >
              {todo.text}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.tag}`}>{c.label}</span>
            {todo.due && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  DUE_STYLE[ds || "upcoming"]
                }`}
              >
                <Calendar size={12} />
                {dueText}
              </span>
            )}
            <button
              onClick={() => onCycle(todo.id)}
              title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.badge}`}
            >
              สำคัญ: {p.label}
            </button>
          </div>
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          aria-label="ลบ"
          className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}

/* ---------- app ---------- */
export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งงานโปรเจกต์วิชาวิศวกรรมคอมพิวเตอร์", done: false, priority: "high", category: "work", due: daysFromNow(-2) },
    { id: 2, text: "เตรียมสไลด์นำเสนอกลุ่ม", done: false, priority: "high", category: "work", due: daysFromNow(0) },
    { id: 3, text: "อ่านหนังสือเตรียมสอบ", done: false, priority: "medium", category: "personal", due: daysFromNow(3) },
    { id: 4, text: "ซื้อของใช้เข้าห้อง", done: true, priority: "low", category: "shopping", due: daysFromNow(-1) },
    { id: 5, text: "ซื้อหูฟังตัวใหม่", done: false, priority: "low", category: "shopping", due: "" },
    { id: 6, text: "วิ่งตอนเย็น 30 นาที", done: false, priority: "medium", category: "health", due: daysFromNow(0) },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("work");
  const [newDue, setNewDue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const nextId = useRef(7);

  const today = toISO(new Date());

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((l) => [
      { id: nextId.current++, text: t, done: false, priority, category: newCategory, due: newDue },
      ...l,
    ]);
    setText("");
    setNewDue("");
  };
  const toggle = (id) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const edit = (id, newText) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  const cycle = (id) =>
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, priority: NEXT_PRIORITY[t.priority] } : t)));
  const remove = (id) => {
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((l) => l.filter((t) => t.id !== id)), 250);
  };
  const clearDone = () => {
    setTodos((l) => l.map((t) => (t.done ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((l) => l.filter((t) => !t.done)), 250);
  };
  const pickCategory = (k) => {
    setCatFilter(k);
    if (k !== "all") setNewCategory(k);
  };

  /* derived data */
  const live = todos.filter((t) => !t.removing);
  const total = live.length;
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter((t) => dueStatus(t, today) === "overdue").length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
    { key: "active", label: "กำลังดำเนินการ", value: activeCount, stroke: "stroke-indigo-500", dot: "bg-indigo-500" },
    { key: "overdue", label: "เลยกำหนด", value: overdueCount, stroke: "stroke-red-500", dot: "bg-red-500" },
  ];

  const q = query.trim().toLowerCase();
  const visible = todos.filter((t) => {
    if (statusFilter === "active" && t.done) return false;
    if (statusFilter === "completed" && !t.done) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  const catCount = (k) => live.filter((t) => t.category === k).length;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-zinc-100 mb-6">
          รายการสิ่งที่ต้องทำ
        </h1>

        <div className="grid gap-4 md:grid-cols-[230px_1fr] items-start">
          {/* ---------- sidebar ---------- */}
          <aside className="space-y-4 md:sticky md:top-6">
            {/* statistics */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 mb-3">สถิติ</h2>
              <div className="flex items-center gap-4 md:flex-col md:items-center">
                <Donut segments={segments} total={total} percent={percent} />
                <div className="flex-1 w-full space-y-1.5 text-sm">
                  <div className="flex justify-between font-medium text-gray-800 dark:text-zinc-100">
                    <span>งานทั้งหมด</span>
                    <span>{total}</span>
                  </div>
                  {segments.map((s) => (
                    <div key={s.key} className="flex items-center justify-between text-gray-600 dark:text-zinc-300">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                      <span>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* categories */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-3 md:p-4">
              <h2 className="hidden md:block text-sm font-semibold text-gray-500 dark:text-zinc-400 mb-2">หมวดหมู่</h2>
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {[["all", { label: "ทั้งหมด", dot: "bg-gray-400" }], ...Object.entries(CATEGORIES)].map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => pickCategory(k)}
                    className={`shrink-0 flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      catFilter === k
                        ? "bg-indigo-500 text-white"
                        : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${v.dot}`} />
                      {v.label}
                    </span>
                    <span
                      className={`text-xs px-1.5 rounded-full ${
                        catFilter === k ? "bg-white/25" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                      }`}
                    >
                      {k === "all" ? total : catCount(k)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ---------- main ---------- */}
          <main className="min-w-0">
            {/* add form */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4 mb-4">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="เพิ่มงานใหม่..."
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={add}
                  aria-label="เพิ่มงาน"
                  className="shrink-0 flex items-center gap-1 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                <label className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
                  หมวดหมู่
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
                  กำหนดส่ง
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-zinc-400">ความสำคัญ</span>
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setPriority(k)}
                      className={`px-3 py-1 rounded-full font-medium transition-all ${v.badge} ${
                        priority === k
                          ? "ring-2 ring-offset-1 ring-indigo-400 dark:ring-offset-zinc-900"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm text-gray-800 dark:text-zinc-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างการค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* status tabs */}
            <div className="flex gap-1 p-1 bg-white dark:bg-zinc-900 rounded-xl shadow-sm mb-4">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setStatusFilter(k)}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === k
                      ? "bg-indigo-500 text-white"
                      : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* list */}
            <ul className="list-none p-0 m-0">
              {visible.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  today={today}
                  onToggle={toggle}
                  onDelete={remove}
                  onEdit={edit}
                  onCycle={cycle}
                />
              ))}
              {visible.length === 0 && (
                <li className="text-center py-10 text-gray-400 dark:text-zinc-500">
                  {q ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการ"}
                </li>
              )}
            </ul>

            {/* footer */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-zinc-400">
              <span>เหลืออีก {remaining} งาน</span>
              <button
                onClick={clearDone}
                disabled={doneCount === 0}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  doneCount === 0 ? "opacity-40 cursor-not-allowed" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
              >
                ล้างที่เสร็จแล้ว ({doneCount})
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-zinc-600 mt-6">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
