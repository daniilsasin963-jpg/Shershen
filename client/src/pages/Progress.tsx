import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Flame, Lightbulb, Palette, CheckCircle2, Zap } from "lucide-react";

const PHRASES = [
  "Мужчина не обещает. Мужчина делает.",
  "Дисциплина — это свобода.",
  "Каждый день — это выбор.",
  "Сила не в словах. Сила в действиях.",
  "Строй. Не жди.",
];

export default function ProgressPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest("GET", "/api/stats").then(r => r.json()),
  });

  const phrase = PHRASES[new Date().getDay() % PHRASES.length];

  if (isLoading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
        <div className="font-display" style={{ color: "#2A2A2A", letterSpacing: "0.15em" }}>ЗАГРУЗКА...</div>
      </div>
    );
  }

  const s = stats || { totalDone: 0, currentStreak: 0, totalIdeas: 0, totalWorks: 0, todayDone: 0 };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <TrendingUp size={22} color="#F5C800" />
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#E8E4DC", letterSpacing: "0.1em" }}>
          ПРОГРЕСС
        </h1>
      </div>

      {/* Фраза дня */}
      <div
        className="wasp-stripe"
        style={{
          border: "1px solid #2A2A2A",
          borderLeft: "3px solid #F5C800",
          padding: "16px 18px",
          marginBottom: 28,
          borderRadius: 4,
        }}
      >
        <p className="font-display" style={{ fontSize: 15, color: "#F5C800", letterSpacing: "0.06em", lineHeight: 1.4 }}>
          «{phrase}»
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
        <StatCard
          icon={<CheckCircle2 size={20} color="#4CAF50" />}
          value={s.totalDone}
          label="Задач выполнено"
          color="#4CAF50"
          testId="stat-total-done"
        />
        <StatCard
          icon={<Flame size={20} color="#F5C800" />}
          value={s.currentStreak}
          label={s.currentStreak === 1 ? "день подряд" : s.currentStreak >= 2 && s.currentStreak <= 4 ? "дня подряд" : "дней подряд"}
          color="#F5C800"
          highlight={s.currentStreak >= 3}
          testId="stat-streak"
        />
        <StatCard
          icon={<Lightbulb size={20} color="#8B6534" />}
          value={s.totalIdeas}
          label="Идей записано"
          color="#8B6534"
          testId="stat-total-ideas"
        />
        <StatCard
          icon={<Palette size={20} color="#6B4CAF" />}
          value={s.totalWorks}
          label="Работ создано"
          color="#6B4CAF"
          testId="stat-total-works"
        />
      </div>

      {/* Сегодня */}
      <div style={{ marginBottom: 24 }}>
        <p className="font-display" style={{ fontSize: 11, color: "#3A3A3A", letterSpacing: "0.14em", marginBottom: 12 }}>
          СЕГОДНЯ
        </p>
        <div style={{ background: "#141414", border: "1px solid #222", padding: 16, borderRadius: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Zap size={18} color="#F5C800" />
            <div>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 700, color: "#E8E4DC", letterSpacing: "0.04em" }}>
                {s.todayDone}
                <span style={{ fontSize: 14, color: "#3A3A3A" }}> / 3 задачи</span>
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#4A4A4A", marginTop: 2 }}>
                {s.todayDone === 0 && "Начни. Первый шаг — самый важный."}
                {s.todayDone === 1 && "Один шаг сделан. Продолжай."}
                {s.todayDone === 2 && "Почти всё. Остался последний удар."}
                {s.todayDone >= 3 && "День закрыт. Ты сделал."}
              </p>
            </div>
          </div>
          {/* Mini progress */}
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 4, background: "#1A1A1A", borderRadius: 2 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((s.todayDone / 3) * 100, 100)}%`,
                  background: s.todayDone >= 3 ? "#4CAF50" : "#F5C800",
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Серия */}
      {s.currentStreak > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="font-display" style={{ fontSize: 11, color: "#3A3A3A", letterSpacing: "0.14em", marginBottom: 12 }}>
            СЕРИЯ
          </p>
          <div
            style={{
              background: "#141414",
              border: `1px solid ${s.currentStreak >= 7 ? "#F5C800" : "#222"}`,
              padding: 16,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 28 }}>
              {s.currentStreak >= 30 ? "🔥" : s.currentStreak >= 14 ? "⚡" : s.currentStreak >= 7 ? "💪" : "▶"}
            </div>
            <div>
              <p className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "#F5C800", letterSpacing: "0.04em" }}>
                {s.currentStreak}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#4A4A4A" }}>
                {s.currentStreak >= 30
                  ? "Легенда. Не сдавайся."
                  : s.currentStreak >= 14
                  ? "Две недели без остановки."
                  : s.currentStreak >= 7
                  ? "Неделя. Так держать."
                  : "Каждый день на счету."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Пусто */}
      {s.totalDone === 0 && s.totalIdeas === 0 && s.totalWorks === 0 && (
        <div
          style={{ textAlign: "center", padding: "28px 0", marginTop: 8 }}
        >
          <p className="font-display" style={{ color: "#1A1A1A", fontSize: 13, letterSpacing: "0.12em" }}>
            НАЧНИ СЕГОДНЯ. ПРОГРЕСС ПОКАЖЕТ ПРАВДУ.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, color, highlight, testId
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  highlight?: boolean;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        background: "#141414",
        border: `1px solid ${highlight ? color : "#222"}`,
        padding: "16px 14px",
        borderRadius: 4,
        borderTop: `2px solid ${color}`,
        boxShadow: highlight ? `0 0 12px ${color}22` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {icon}
      </div>
      <p className="font-display" style={{ fontSize: 32, fontWeight: 700, color, letterSpacing: "0.02em", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#4A4A4A", marginTop: 4, lineHeight: 1.3 }}>
        {label}
      </p>
    </div>
  );
}
