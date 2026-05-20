import { useParams, Navigate } from "react-router-dom";
import { categories, type IntegrationCategory } from "@/data/integrations";
import { useIntegrations } from "@/hooks/use-integrations";
import IntegrationCard from "@/components/IntegrationCard";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const cat = categories[categoryId as IntegrationCategory];
  const { data: integrations, isLoading } = useIntegrations();

  if (!cat) return <Navigate to="/" replace />;

  const items = (integrations || []).filter((i) => i.category === categoryId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <SEO
        title={`${cat.label} — Integrime | Integrations Hub`}
        description={cat.description}
        path={`/category/${categoryId}`}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {cat.emoji} {cat.label}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
