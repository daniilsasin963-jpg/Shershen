import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Pause, Square, Zap } from "lucide-react";
import type { Task } from "@shared/schema";

const today = new Date().toISOString().split("T")[0];

const DURATIONS = [
  { label: "25", minutes: 25, desc: "Поморо" },
  { label: "45", minutes: 45, desc: "Глубокий" },
  { label: "90", minutes: 90, desc: "Мощный" },
];

const PHRASES = [
  "Не ной. Делай шаг.",
  "Один шаг. Сейчас.",
  "Тишина — твоя броня.",
  "Сделай — потом отдохни.",
  "Никаких объяснений. Просто делай.",
  "Ты уже начал. Не останавливайся.",
];

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function ModePage() {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", today],
    queryFn: () => apiRequest("GET", `/api/tasks?date=${today}`).then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/focus-sessions", data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/stats"] }),
  });

  const pendingTasks = tasks.filter(t => t.status === "pending");

  useEffect(() => {
    if (!running || paused) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setFinished(true);
          saveMutation.mutate({ taskId: selectedTaskId, duration: selectedDuration, completedAt: new Date().toISOString() });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, paused]);

  const start = () => {
    setTimeLeft(selectedDuration * 60);
    setFinished(false);
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setRunning(true);
    setPaused(false);
  };
  const toggle = () => setPaused(p => !p);
  const stop = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPaused(false);
    setTimeLeft(selectedDuration * 60);
    setFinished(false);
  };

  const progress = (running || finished) ? ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100 : 0;
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Zap size={22} color="#F5C800" />
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#E8E4DC", letterSpacing: "0.1em" }}>
          РЕЖИМ ШЕРШНЯ
        </h1>
      </div>

      {/* Timer — centred */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", width: 216, height: 216 }}>
          <svg width="216" height="216" className="timer-ring" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="108" cy="108" r={r} fill="none" stroke="#1A1A1A" strokeWidth="7" />
            <circle
              cx="108" cy="108" r={r}
              fill="none"
              stroke={finished ? "#4CAF50" : "#F5C800"}
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: 48, fontWeight: 700, color: finished ? "#4CAF50" : "#E8E4DC", letterSpacing: "0.02em", lineHeight: 1 }}>
              {finished ? "✓" : formatTime(timeLeft)}
            </span>
            {!finished && (
              <span className="font-display" style={{ fontSize: 10, color: "#2E2E2E", letterSpacing: "0.15em", marginTop: 4 }}>
                {DURATIONS.find(d => d.minutes === selectedDuration)?.desc?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Phrase */}
      {running && !paused && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p className="font-display" style={{ fontSize: 16, color: "#F5C800", letterSpacing: "0.08em" }}>{phrase}</p>
        </div>
      )}
      {finished && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p className="font-display" style={{ fontSize: 14, color: "#4CAF50", letterSpacing: "0.1em" }}>ГОТОВО. ШАГ СДЕЛАН.</p>
        </div>
      )}

      {/* Duration picker */}
      {!running && (
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {DURATIONS.map(d => (
            <button
              key={d.minutes}
              data-testid={`button-duration-${d.minutes}`}
              onClick={() => { setSelectedDuration(d.minutes); setTimeLeft(d.minutes * 60); setFinished(false); }}
              style={{
                flex: 1,
                background: selectedDuration === d.minutes ? "#F5C800" : "#141414",
                color: selectedDuration === d.minutes ? "#0D0D0D" : "#3A3A3A",
                border: `1px solid ${selectedDuration === d.minutes ? "#F5C800" : "#1E1E1E"}`,
                minHeight: 64,
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              <div style={{ fontSize: 26 }}>{d.label}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{d.desc.toUpperCase()}</div>
            </button>
          ))}
        </div>
      )}

      {/* Task picker */}
      {!running && pendingTasks.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <p className="font-display" style={{ fontSize: 10, color: "#2E2E2E", letterSpacing: "0.14em", marginBottom: 9 }}>
            ЗАДАЧА (необязательно)
          </p>
          {pendingTasks.map(t => (
            <button
              key={t.id}
              data-testid={`button-task-select-${t.id}`}
              onClick={() => setSelectedTaskId(selectedTaskId === t.id ? null : t.id)}
              style={{
                width: "100%",
                background: selectedTaskId === t.id ? "#1A1500" : "#141414",
                border: `1px solid ${selectedTaskId === t.id ? "#F5C800" : "#1E1E1E"}`,
                color: selectedTaskId === t.id ? "#F5C800" : "#5A5550",
                minHeight: 48,
                padding: "0 16px",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 8 }}>
        {!running ? (
          <button
            className="btn-primary pulse-yellow"
            onClick={start}
            data-testid="button-start-focus"
            style={{ flex: 1, minHeight: 52, fontSize: 15 }}
          >
            <Play size={18} fill="currentColor" /> НАЧАТЬ
          </button>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={toggle}
              data-testid="button-toggle-pause"
              style={{ flex: 1, minHeight: 52, fontSize: 14 }}
            >
              {paused ? <><Play size={16} fill="currentColor" /> ПРОДОЛЖИТЬ</> : <><Pause size={16} /> ПАУЗА</>}
            </button>
            <button
              className="btn-ghost"
              onClick={stop}
              data-testid="button-stop-focus"
              style={{ minWidth: 52, minHeight: 52, padding: "0" }}
            >
              <Square size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
