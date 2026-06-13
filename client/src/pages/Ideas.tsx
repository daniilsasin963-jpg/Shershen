import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Lightbulb, Plus, Trash2, FileText, Mic, Camera, Hexagon, Folder } from "lucide-react";
import type { Idea } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { value: "text",    label: "Текст",   icon: FileText },
  { value: "voice",   label: "Голос",   icon: Mic },
  { value: "photo",   label: "Фото",    icon: Camera },
  { value: "tattoo",  label: "Тату",    icon: Hexagon },
  { value: "project", label: "Проект",  icon: Folder },
];

const TYPE_COLORS: Record<string, string> = {
  text: "#4A4A4A", voice: "#8B6534", photo: "#2A5A8B", tattoo: "#F5C800", project: "#4CAF50",
};

export default function IdeasPage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [filter, setFilter] = useState("all");

  const { data: ideas = [], isLoading } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
    queryFn: () => apiRequest("GET", "/api/ideas").then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ideas", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setContent(""); setShowAdd(false);
    },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ideas/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const filtered = filter === "all" ? ideas : ideas.filter(i => i.type === filter);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Lightbulb size={22} color="#F5C800" />
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#E8E4DC", letterSpacing: "0.1em" }}>ИДЕИ</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-idea" style={{ padding: "0 16px" }}>
          <Plus size={15} /> ЗАПИСАТЬ
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "#141414", border: "1px solid #222", padding: 16, marginBottom: 18, borderRadius: 10 }}>
          {/* Type chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {TYPES.map(t => {
              const Icon = t.icon;
              const sel = type === t.value;
              return (
                <button
                  key={t.value}
                  data-testid={`button-type-${t.value}`}
                  onClick={() => setType(t.value)}
                  style={{
                    background: sel ? "#1A1500" : "#0D0D0D",
                    border: `1px solid ${sel ? "#F5C800" : "#252525"}`,
                    color: sel ? "#F5C800" : "#3A3A3A",
                    minHeight: 36,
                    padding: "0 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                  }}
                >
                  <Icon size={12} />{t.label.toUpperCase()}
                </button>
              );
            })}
          </div>
          <textarea
            data-testid="input-idea-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Запиши мысль..."
            rows={3}
            style={{ ...inputStyle, resize: "none" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" onClick={() => { if (!content.trim()) return; addMutation.mutate({ content: content.trim(), type, createdAt: new Date().toISOString() }); }} disabled={addMutation.isPending} style={{ flex: 1 }} data-testid="button-save-idea">СОХРАНИТЬ</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>ВСЕ ({ideas.length})</Chip>
        {TYPES.map(t => {
          const n = ideas.filter(i => i.type === t.value).length;
          return n > 0 ? <Chip key={t.value} active={filter === t.value} onClick={() => setFilter(t.value)}>{t.label.toUpperCase()} ({n})</Chip> : null;
        })}
      </div>

      {/* Empty */}
      {!isLoading && ideas.length === 0 && (
        <div style={{ textAlign: "center", padding: "52px 0" }}>
          <p className="font-display" style={{ color: "#1E1E1E", fontSize: 13, letterSpacing: "0.1em", marginBottom: 10 }}>НИ ОДНОЙ МЫСЛИ НЕ ЗАПИСАНО</p>
          <p style={{ color: "#1E1E1E", fontSize: 14 }}>Каждая идея — это зерно.</p>
        </div>
      )}

      {/* List */}
      {filtered.map(idea => {
        const info = TYPES.find(t => t.value === idea.type);
        const Icon = info?.icon || FileText;
        const color = TYPE_COLORS[idea.type] || "#4A4A4A";
        const date = new Date(idea.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

        return (
          <div key={idea.id} data-testid={`card-idea-${idea.id}`}
            style={{ background: "#141414", border: "1px solid #1E1E1E", padding: "14px 16px", marginBottom: 8, borderRadius: 10, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <Icon size={12} color={color} />
                  <span className="font-display" style={{ fontSize: 10, color, letterSpacing: "0.1em" }}>{info?.label.toUpperCase()}</span>
                  <span style={{ color: "#222", fontSize: 10, marginLeft: "auto" }}>{date}</span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#C0BDB5", lineHeight: 1.5 }}>{idea.content}</p>
              </div>
              {/* 44px touch zone */}
              <button
                onClick={() => deleteMutation.mutate(idea.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#252525", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: -8 }}
                data-testid={`button-delete-idea-${idea.id}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#F5C800" : "#141414",
        color: active ? "#0D0D0D" : "#3A3A3A",
        border: `1px solid ${active ? "#F5C800" : "#1E1E1E"}`,
        minHeight: 34,
        padding: "0 11px",
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "'Oswald', sans-serif",
        fontSize: 10,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0D0D0D",
  border: "1px solid #252525",
  color: "#E8E4DC",
  padding: "13px 14px",
  fontFamily: "'Inter', sans-serif",
  fontSize: 16, /* prevents iOS zoom */
  borderRadius: 8,
  outline: "none",
};
