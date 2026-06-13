import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Palette, Plus, Edit3, Trash2, Hexagon, PenTool, Image, Hash, FolderOpen } from "lucide-react";
import type { Work } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "tattoo",   label: "Тату",     icon: Hexagon },
  { value: "sketch",   label: "Эскизы",   icon: PenTool },
  { value: "photo",    label: "Фото",     icon: Image },
  { value: "symbol",   label: "Символы",  icon: Hash },
  { value: "project",  label: "Проекты",  icon: FolderOpen },
];
const STATUSES = [
  { value: "idea",        label: "Идея",     cls: "tag-idea" },
  { value: "in_progress", label: "В работе", cls: "tag-inprogress" },
  { value: "done",        label: "Готово",   cls: "tag-done" },
];
const CAT_COLORS: Record<string, string> = {
  tattoo: "#F5C800", sketch: "#8B6534", photo: "#2A5A8B", symbol: "#6B4CAF", project: "#4CAF50",
};

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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "#F5C800" : "#141414",
      color: active ? "#0D0D0D" : "#3A3A3A",
      border: `1px solid ${active ? "#F5C800" : "#1E1E1E"}`,
      minHeight: 34, padding: "0 11px", borderRadius: 6,
      cursor: "pointer", fontFamily: "'Oswald', sans-serif",
      fontSize: 10, letterSpacing: "0.08em", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

export default function CreativePage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ title: "", meaning: "", category: "tattoo", status: "idea" });

  const { data: works = [], isLoading } = useQuery<Work[]>({
    queryKey: ["/api/works"],
    queryFn: () => apiRequest("GET", "/api/works").then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/works", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/works"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); cancelAdd(); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/works/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/works"] }); cancelAdd(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/works/${id}`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/works"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); },
  });

  const cancelAdd = () => { setShowAdd(false); setEditingId(null); setForm({ title: "", meaning: "", category: "tattoo", status: "idea" }); };
  const startEdit = (w: Work) => { setForm({ title: w.title, meaning: w.meaning, category: w.category, status: w.status }); setEditingId(w.id); setShowAdd(true); };
  const handleSave = () => {
    if (!form.title.trim()) return;
    editingId ? updateMutation.mutate({ id: editingId, data: form }) : addMutation.mutate({ ...form, createdAt: new Date().toISOString() });
  };

  const filtered = works.filter(w => filterCat === "all" || w.category === filterCat).filter(w => filterStatus === "all" || w.status === filterStatus);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Palette size={22} color="#F5C800" />
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#E8E4DC", letterSpacing: "0.1em" }}>ТВОРЧЕСТВО</h1>
        </div>
        <button className="btn-primary" onClick={() => { cancelAdd(); setShowAdd(true); }} data-testid="button-add-work" style={{ padding: "0 16px" }}>
          <Plus size={15} /> ДОБАВИТЬ
        </button>
      </div>

      {/* Form */}
      {showAdd && (
        <div style={{ background: "#141414", border: "1px solid #222", padding: 16, marginBottom: 18, borderRadius: 10 }}>
          <p className="font-display" style={{ fontSize: 11, color: "#F5C800", letterSpacing: "0.12em", marginBottom: 14 }}>
            {editingId ? "РЕДАКТИРОВАТЬ" : "НОВАЯ РАБОТА"}
          </p>
          <input data-testid="input-work-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название..." style={inputStyle} />
          <textarea data-testid="input-work-meaning" value={form.meaning} onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))} placeholder="Смысл / описание..." rows={2} style={{ ...inputStyle, resize: "none", marginTop: 8 }} />

          <p className="font-display" style={{ fontSize: 10, color: "#2A2A2A", letterSpacing: "0.12em", marginTop: 12, marginBottom: 7 }}>РАЗДЕЛ</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <button key={c.value} data-testid={`button-cat-${c.value}`} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                style={{ background: form.category === c.value ? "#1A1500" : "#0D0D0D", border: `1px solid ${form.category === c.value ? "#F5C800" : "#252525"}`, color: form.category === c.value ? "#F5C800" : "#3A3A3A", minHeight: 36, padding: "0 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.07em" }}>
                {c.label.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="font-display" style={{ fontSize: 10, color: "#2A2A2A", letterSpacing: "0.12em", marginBottom: 7 }}>СТАТУС</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {STATUSES.map(s => (
              <button key={s.value} data-testid={`button-status-${s.value}`} onClick={() => setForm(f => ({ ...f, status: s.value }))}
                style={{ background: form.status === s.value ? (s.value === "done" ? "#0A1A0A" : s.value === "in_progress" ? "#1A1500" : "#1A1A1A") : "#0D0D0D", border: `1px solid ${form.status === s.value ? (s.value === "done" ? "#4CAF50" : s.value === "in_progress" ? "#F5C800" : "#3A3A3A") : "#252525"}`, color: form.status === s.value ? (s.value === "done" ? "#4CAF50" : s.value === "in_progress" ? "#F5C800" : "#7A7570") : "#3A3A3A", minHeight: 36, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.07em" }}>
                {s.label.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending} style={{ flex: 1 }} data-testid="button-save-work">СОХРАНИТЬ</button>
            <button className="btn-ghost" onClick={cancelAdd}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 7, overflowX: "auto", paddingBottom: 2 }}>
        <Chip active={filterCat === "all"} onClick={() => setFilterCat("all")}>ВСЕ</Chip>
        {CATEGORIES.map(c => <Chip key={c.value} active={filterCat === c.value} onClick={() => setFilterCat(c.value)}>{c.label.toUpperCase()}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
        <Chip active={filterStatus === "all"} onClick={() => setFilterStatus("all")}>СТАТУС: ВСЕ</Chip>
        {STATUSES.map(s => <Chip key={s.value} active={filterStatus === s.value} onClick={() => setFilterStatus(s.value)}>{s.label.toUpperCase()}</Chip>)}
      </div>

      {!isLoading && works.length === 0 && (
        <div style={{ textAlign: "center", padding: "52px 0" }}>
          <p className="font-display" style={{ color: "#1E1E1E", fontSize: 13, letterSpacing: "0.1em" }}>НЕТ РАБОТ</p>
        </div>
      )}

      {filtered.map(work => {
        const cat = CATEGORIES.find(c => c.value === work.category);
        const Icon = cat?.icon || Palette;
        const color = CAT_COLORS[work.category] || "#4A4A4A";
        const status = STATUSES.find(s => s.value === work.status);
        const date = new Date(work.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" });
        return (
          <div key={work.id} data-testid={`card-work-${work.id}`}
            style={{ background: "#141414", border: "1px solid #1E1E1E", padding: "14px 16px", marginBottom: 8, borderRadius: 10, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                  <Icon size={12} color={color} />
                  <span className="font-display" style={{ fontSize: 10, color, letterSpacing: "0.1em" }}>{cat?.label.toUpperCase()}</span>
                  <span className={`tag ${status?.cls}`}>{status?.label}</span>
                  <span style={{ color: "#1E1E1E", fontSize: 10, marginLeft: "auto" }}>{date}</span>
                </div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 600, color: "#E8E4DC", letterSpacing: "0.03em", marginBottom: work.meaning ? 5 : 0 }}>{work.title}</p>
                {work.meaning && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#4A4A4A", lineHeight: 1.4 }}>{work.meaning}</p>}
              </div>
              <div style={{ display: "flex", gap: 0, marginLeft: 4 }}>
                <button onClick={() => startEdit(work)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2A2A2A", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-edit-work-${work.id}`}><Edit3 size={15} /></button>
                <button onClick={() => deleteMutation.mutate(work.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2A2A2A", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-delete-work-${work.id}`}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
