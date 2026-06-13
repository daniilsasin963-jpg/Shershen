import { useHashLocation } from "wouter/use-hash-location";
import { CheckSquare, Zap, Lightbulb, Palette, TrendingUp } from "lucide-react";

const tabs = [
  { path: "/",          label: "Сегодня",    icon: CheckSquare },
  { path: "/mode",      label: "Режим",      icon: Zap },
  { path: "/ideas",     label: "Идеи",       icon: Lightbulb },
  { path: "/creative",  label: "Творчество", icon: Palette },
  { path: "/progress",  label: "Прогресс",   icon: TrendingUp },
];

export default function BottomNav() {
  const [location, setLocation] = useHashLocation();

  return (
    <nav className="bottom-nav" role="tablist">
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location === path;
        return (
          <button
            key={path}
            role="tab"
            aria-selected={active}
            aria-label={label}
            className={`nav-item${active ? " active" : ""}`}
            onClick={() => setLocation(path)}
            data-testid={`nav-${label.toLowerCase()}`}
          >
            <Icon size={22} strokeWidth={active ? 2 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
