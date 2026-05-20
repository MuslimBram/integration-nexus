import { useIntegrations } from "@/hooks/use-integrations";
import IntegrationCard from "@/components/IntegrationCard";
import { Badge } from "@/components/ui/badge";
import { categories, type IntegrationCategory } from "@/data/integrations";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";

export default function Dashboard() {
  const { data: integrations, isLoading } = useIntegrations();

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const items = integrations || [];
  const connected = items.filter(i => i.status === "connected").length;
  const total = items.length;
  const oauthCount = items.filter(i => i.supports_oauth).length;

  return (
    <div className="space-y-8 max-w-6xl">
      <SEO
        title="Integrations Hub Dashboard — Përmbledhje e integrimeve"
        description="Përmbledhje e të gjitha integrimeve aktive: numri i lidhjeve, OAuth, dhe kanalet e komunikimit në Integrations Hub."
        path="/"
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations Hub Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {connected}/{total} integrime aktive
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Integrime" value={total} />
        <StatCard label="Të lidhura" value={connected} variant="success" />
        <StatCard label="Të pa-lidhura" value={total - connected} />
        <StatCard label="Me OAuth" value={oauthCount} variant="info" />
      </div>

      {(Object.entries(categories) as [IntegrationCategory, typeof categories[IntegrationCategory]][]).map(
        ([key, cat]) => {
          const categoryItems = items.filter(i => i.category === key);
          if (categoryItems.length === 0) return null;
          return (
            <section key={key}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{cat.emoji}</span>
                <h2 className="text-lg font-semibold text-foreground">{cat.label}</h2>
                <Badge variant="secondary" className="text-xs">{categoryItems.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((integration) => (
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
