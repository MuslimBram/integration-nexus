import { Link, useLocation } from "react-router-dom";
import { categories, type IntegrationCategory } from "@/data/integrations";
import { LayoutDashboard, Settings, Workflow, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navItems: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: "/n8n", label: "n8n Workflows", icon: <Workflow className="w-4 h-4" /> },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">⚡ Integrations Hub</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Menaxho të gjitha integrimet</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === item.to
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        <div className="pt-4 pb-2 px-3">
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">Kategoritë</span>
        </div>

        {(Object.entries(categories) as [IntegrationCategory, typeof categories[IntegrationCategory]][]).map(
          ([key, cat]) => (
            <Link
              key={key}
              to={`/category/${key}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === `/category/${key}`
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Link>
          )
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
