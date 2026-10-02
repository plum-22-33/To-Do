import { useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    bar: "bg-emerald-400",
  },
  medium: {
    label: "ปานกลาง",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    bar: "bg-amber-400",
  },
  high: {
    label: "สูง",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    bar: "bg-red-500",
  },
};
const NEXT_PRIORITY = { low: "medium", medium: "high", high: "low" };
const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];

function TodoItem({ todo, onToggle, onDelete, onEdit, onCycle }) {
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

  return (
    <li className={`todo-item mb-2 ${todo.removing ? "removing" : ""}`}>
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden pr-3">
        <span className={`self-stretch w-1.5 shrink-0 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label="ทำเครื่องหมายว่าเสร็จ"
          className={`ml-1 my-3 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
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
                todo.done
                  ? "line-through text-gray-400 dark:text-zinc-500"
                  : "text-gray-800 dark:text-zinc-100"
              }`}
            >
              {todo.text}
            </span>
          )}
        </div>

        <button
          onClick={() => onCycle(todo.id)}
          title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${p.badge}`}
        >
          {p.label}
        </button>

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

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งงานโปรเจกต์วิชาวิศวกรรมคอมพิวเตอร์", done: false, priority: "high" },
    { id: 2, text: "อ่านหนังสือเตรียมสอบ", done: false, priority: "medium" },
    { id: 3, text: "ซื้อของใช้เข้าห้อง", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const nextId = useRef(4);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((l) => [{ id: nextId.current++, text: t, done: false, priority }, ...l]);
    setText("");
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

  const remaining = todos.filter((t) => !t.done && !t.removing).length;
  const doneCount = todos.filter((t) => t.done).length;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-zinc-100 mb-6">
          รายการสิ่งที่ต้องทำ
        </h1>

        {/* Add form */}
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
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span className="text-gray-500 dark:text-zinc-400">ความสำคัญ:</span>
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

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-zinc-900 rounded-xl shadow-sm mb-4">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                filter === k
                  ? "bg-indigo-500 text-white"
                  : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <ul className="list-none p-0 m-0">
          {visible.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={toggle}
              onDelete={remove}
              onEdit={edit}
              onCycle={cycle}
            />
          ))}
          {visible.length === 0 && (
            <li className="text-center py-10 text-gray-400 dark:text-zinc-500">ไม่มีรายการ</li>
          )}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-zinc-400">
          <span>เหลืออีก {remaining} งาน</span>
          <button
            onClick={clearDone}
            disabled={doneCount === 0}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              doneCount === 0
                ? "opacity-40 cursor-not-allowed"
                : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
          >
            ล้างที่เสร็จแล้ว ({doneCount})
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 dark:text-zinc-600 mt-6">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
