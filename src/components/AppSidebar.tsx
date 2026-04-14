import { Link, useLocation } from "react-router-dom";
import { categories, type IntegrationCategory } from "@/data/integrations";
import { LayoutDashboard, Settings, Workflow, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems: { to: string; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: "/n8n", label: "n8n Workflows", icon: <Workflow className="w-4 h-4" />, adminOnly: true },
];

export default function AppSidebar() {
  const { user, signOut, role, isAdmin } = useAuth();

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    business_owner: "Business",
    freelancer: "Freelancer",
    ambassador: "Ambassador",
    manager: "Manager",
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">⚡ Integrations Hub</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Menaxho të gjitha integrimet</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map((item) => (
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

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="px-3 space-y-1">
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
            {role && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                <Shield className="w-2.5 h-2.5 mr-1" />
                {roleLabels[role] || role}
              </Badge>
            )}
          </div>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Dil
        </Button>
      </div>
    </aside>
  );
}
