import { integrations, categories, type IntegrationCategory } from "@/data/integrations";
import IntegrationCard from "@/components/IntegrationCard";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const total = integrations.length;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {connected}/{total} integrime aktive
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Integrime" value={total} />
        <StatCard label="Të lidhura" value={connected} variant="success" />
        <StatCard label="Të pa-lidhura" value={total - connected} />
        <StatCard label="Me OAuth" value={integrations.filter((i) => i.supportsOAuth).length} variant="info" />
      </div>

      {(Object.entries(categories) as [IntegrationCategory, typeof categories[IntegrationCategory]][]).map(
        ([key, cat]) => {
          const items = integrations.filter((i) => i.category === key);
          return (
            <section key={key}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{cat.emoji}</span>
                <h2 className="text-lg font-semibold text-foreground">{cat.label}</h2>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            </section>
          );
        }
      )}
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant?: "success" | "info" }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${
        variant === "success" ? "text-success" : variant === "info" ? "text-info" : "text-foreground"
      }`}>{value}</p>
    </div>
  );
}
