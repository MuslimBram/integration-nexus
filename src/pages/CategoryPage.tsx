import { useParams, Navigate } from "react-router-dom";
import { integrations, categories, type IntegrationCategory } from "@/data/integrations";
import IntegrationCard from "@/components/IntegrationCard";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const cat = categories[categoryId as IntegrationCategory];

  if (!cat) return <Navigate to="/" replace />;

  const items = integrations.filter((i) => i.category === categoryId);

  return (
    <div className="space-y-6 max-w-6xl">
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
