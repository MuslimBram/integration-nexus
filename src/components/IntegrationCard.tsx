import type { Integration } from "@/data/integrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const statusConfig = {
  connected: { label: "Connected", className: "bg-success/15 text-success border-success/30" },
  disconnected: { label: "Disconnected", className: "bg-muted text-muted-foreground border-border" },
  error: { label: "Error", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props {
  integration: Integration;
  onConnect?: (id: string) => void;
}

export default function IntegrationCard({ integration, onConnect }: Props) {
  const status = statusConfig[integration.status];

  return (
    <Card className="glass-card hover:shadow-md transition-all duration-200 group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.icon}</span>
            <div>
              <h3 className="font-semibold text-card-foreground text-sm">{integration.name}</h3>
              {integration.supportsOAuth && (
                <span className="text-[10px] text-primary font-medium">OAuth</span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${status.className}`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{integration.description}</p>
        <div className="flex gap-2">
          {integration.status === "disconnected" ? (
            <Button size="sm" className="w-full text-xs" onClick={() => onConnect?.(integration.id)}>
              {integration.supportsOAuth ? "Connect with OAuth" : "Configure"}
            </Button>
          ) : integration.status === "connected" ? (
            <>
              <Button size="sm" variant="outline" className="flex-1 text-xs">Manage</Button>
              <Button size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive">
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" variant="destructive" className="w-full text-xs">
              Reconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
