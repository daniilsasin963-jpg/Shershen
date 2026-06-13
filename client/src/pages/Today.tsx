import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, CheckCircle2, ArrowRight, Circle, Star } from "lucide-react";
import type { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const today = new Date().toISOString().split("T")[0];

const MOTTOS = [
  "Мужчина не обещает. Мужчина делает.",
  "Дисциплина — это свобода.",
  "Встал. Собрался. Сделал.",
  "Не думай. Начни.",
  "Сила рождается в тишине.",
];

export default function TodayPage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const motto = MOTTOS[new Date().getDay() % MOTTOS.length];

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", today],
    queryFn: () => apiRequest("GET", `/api/tasks?date=${today}`).then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/tasks", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", today] });
      setNewTitle("");
      setShowAdd(false);
    },
    onError: (e: any) => toast({ title: e.message || "Ошибка", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/tasks/${id}/status`, { status }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const usedPriorities = tasks.map(t => t.priority);
    const nextPriority = [1, 2, 3].find(p => !usedPriorities.includes(p)) || 1;
    addMutation.mutate({ title: newTitle.trim(), priority: nextPriority, date: today, status: "pending" });
  };

  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
  const doneTasks = sortedTasks.filter(t => t.status === "done");
  const pendingTasks = sortedTasks.filter(t => t.status !== "done");

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-label="ШЕРШЕНЬ">
            <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" fill="#F5C800" opacity="0.12" />
            <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke="#F5C800" strokeWidth="1.5" fill="none" />
            <line x1="2" y1="9" x2="26" y2="9" stroke="#F5C800" strokeWidth="0.7" opacity="0.35" />
            <line x1="2" y1="19" x2="26" y2="19" stroke="#F5C800" strokeWidth="0.7" opacity="0.35" />
            <circle cx="14" cy="14" r="3" fill="#F5C800" />
          </svg>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: "#F5C800", letterSpacing: "0.1em" }}>
            ШЕРШЕНЬ
          </h1>
        </div>
        <p className="motto">{motto}</p>
      </div>

      {/* Дата */}
      <div style={{ marginBottom: 22 }}>
        <span className="font-display" style={{ fontSize: 11, color: "#2E2E2E", letterSpacing: "0.15em" }}>
          {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        </span>
      </div>

      {/* Заголовок секции */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 className="font-display" style={{ fontSize: 13, color: "#5A5550", letterSpacing: "0.12em" }}>
          ЗАДАЧИ НА ДЕНЬ
        </h2>
        {tasks.length < 3 && (
          <button
            data-testid="button-add-task"
            onClick={() => setShowAdd(!showAdd)}
            style={{
              color: "#F5C800", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              minHeight: 44, minWidth: 44, justifyContent: "flex-end",
              padding: "0 0 0 8px",
            }}
          >
            <Plus size={15} />
            <span className="font-display" style={{ fontSize: 11, letterSpacing: "0.1em" }}>ДОБАВИТЬ</span>
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "#141414", border: "1px solid #222", padding: 16, marginBottom: 12, borderRadius: 10 }}>
          <input
            data-testid="input-task-title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Что нужно сделать..."
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" onClick={handleAdd} disabled={addMutation.isPending} style={{ flex: 1 }} data-testid="button-save-task">
              {addMutation.isPending ? "..." : "ДОБАВИТЬ"}
            </button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && tasks.length === 0 && !showAdd && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p className="font-display" style={{ color: "#2A2A2A", fontSize: 13, letterSpacing: "0.1em", marginBottom: 20 }}>
            ДЕНЬ ПУСТОЙ
          </p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + ДОБАВИТЬ ЗАДАЧУ
          </button>
        </div>
      )}

      {/* Tasks */}
      {pendingTasks.map(t => (
        <TaskCard key={t.id} task={t} onStatus={s => statusMutation.mutate({ id: t.id, status: s })} />
      ))}
      {doneTasks.length > 0 && (
        <>
          <div className="divider" />
          {doneTasks.map(t => (
            <TaskCard key={t.id} task={t} onStatus={s => statusMutation.mutate({ id: t.id, status: s })} />
          ))}
        </>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span className="font-display" style={{ fontSize: 10, color: "#2E2E2E", letterSpacing: "0.12em" }}>ВЫПОЛНЕНО</span>
            <span className="font-display" style={{ fontSize: 11, color: "#F5C800" }}>{doneTasks.length}/{tasks.length}</span>
          </div>
          <div style={{ height: 3, background: "#1A1A1A", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${(doneTasks.length / tasks.length) * 100}%`,
              background: "#F5C800",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatus }: { task: Task; onStatus: (s: string) => void }) {
  const isDone = task.status === "done";
  const labels = ["", "Главное", "Второе", "Третье"];
  const colors = ["", "#F5C800", "#8B6534", "#4A4A4A"];

  return (
    <div
      data-testid={`card-task-${task.id}`}
      style={{
        background: isDone ? "#0C0C0C" : "#141414",
        border: `1px solid ${isDone ? "#181818" : "#1E1E1E"}`,
        borderLeft: `3px solid ${isDone ? "#1E1E1E" : colors[task.priority]}`,
        padding: "0 14px",
        marginBottom: 8,
        borderRadius: 10,
        opacity: isDone ? 0.55 : 1,
        transition: "opacity 0.2s",
        /* Min 56px tall for comfortable touch */
        minHeight: 56,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Done toggle — 44px zone */}
      <button
        onClick={() => onStatus(isDone ? "pending" : "done")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          minWidth: 44, minHeight: 44,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: -8, flexShrink: 0,
        }}
        data-testid={`button-done-${task.id}`}
      >
        {isDone
          ? <CheckCircle2 size={20} color="#4CAF50" />
          : <Circle size={20} color={colors[task.priority]} />
        }
      </button>

      {/* Content */}
      <div style={{ flex: 1, paddingTop: 14, paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span className="font-display" style={{ fontSize: 10, color: isDone ? "#2E2E2E" : colors[task.priority], letterSpacing: "0.1em" }}>
            {labels[task.priority]}
          </span>
          {task.priority === 1 && !isDone && <Star size={9} color="#F5C800" fill="#F5C800" />}
        </div>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          color: isDone ? "#3A3A3A" : "#E0DCD4",
          textDecoration: isDone ? "line-through" : "none",
          lineHeight: 1.35,
        }}>
          {task.title}
        </p>
      </div>

      {/* Move — 44px zone */}
      {!isDone && task.status !== "moved" && (
        <button
          onClick={() => onStatus("moved")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#2A2A2A", minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginRight: -8, flexShrink: 0,
          }}
          title="Перенести"
          data-testid={`button-move-${task.id}`}
        >
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0D0D0D",
  border: "1px solid #2A2A2A",
  color: "#E8E4DC",
  padding: "13px 14px",
  fontFamily: "'Inter', sans-serif",
  fontSize: 16, /* ≥16px — prevents iOS zoom */
  borderRadius: 8,
  outline: "none",
};
