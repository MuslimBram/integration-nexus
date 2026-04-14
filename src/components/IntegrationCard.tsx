import { useState } from "react";
import type { DbIntegration } from "@/hooks/use-integrations";
import { useSaveApiKey, useDisconnectIntegration, useOAuthConnect } from "@/hooks/use-integrations";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const statusConfig = {
  connected: { label: "Connected", className: "bg-success/15 text-success border-success/30" },
  disconnected: { label: "Disconnected", className: "bg-muted text-muted-foreground border-border" },
  error: { label: "Error", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const OAUTH_PROVIDERS = ["google", "github", "facebook", "tiktok", "airtable"];

interface Props {
  integration: DbIntegration;
}

export default function IntegrationCard({ integration }: Props) {
  const { role } = useAuth();
  const canManage = role && ["super_admin", "admin", "business_owner", "manager"].includes(role);
  const status = statusConfig[integration.status];
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [extraConfig, setExtraConfig] = useState<Record<string, string>>({});

  const saveApiKey = useSaveApiKey();
  const disconnect = useDisconnectIntegration();
  const oauthConnect = useOAuthConnect();

  const isOAuthProvider = integration.supports_oauth &&
    OAUTH_PROVIDERS.some(p => integration.provider_id.includes(p) ||
      integration.name.toLowerCase().includes(p));

  const providerKey = OAUTH_PROVIDERS.find(p =>
    integration.provider_id.includes(p) || integration.name.toLowerCase().includes(p)
  );

  const handleConnect = () => {
    if (isOAuthProvider && providerKey) {
      oauthConnect.mutate({ provider: providerKey, integrationId: integration.id });
    } else {
      setShowConfig(true);
    }
  };

  const handleSaveConfig = () => {
    saveApiKey.mutate({ id: integration.id, apiKey, config: extraConfig });
    setShowConfig(false);
    setApiKey("");
    setExtraConfig({});
  };

  const handleDisconnect = () => {
    disconnect.mutate(integration.id);
  };

  return (
    <>
      <Card className="glass-card hover:shadow-md transition-all duration-200 group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h3 className="font-semibold text-card-foreground text-sm">{integration.name}</h3>
                {integration.supports_oauth && (
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
          {canManage ? (
            <div className="flex gap-2">
              {integration.status === "disconnected" ? (
                <Button size="sm" className="w-full text-xs" onClick={handleConnect}>
                  {isOAuthProvider ? "Connect with OAuth" : "Configure"}
                </Button>
              ) : integration.status === "connected" ? (
                <>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowConfig(true)}>
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={handleDisconnect}
                    disabled={disconnect.isPending}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="destructive" className="w-full text-xs" onClick={handleConnect}>
                  Reconnect
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">Vetëm shikimi — kontaktoni admin-in</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{integration.icon}</span> {integration.name}
            </DialogTitle>
            <DialogDescription>
              {integration.status === "connected" ? "Menaxho konfigurimin" : "Konfiguro integrimin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(integration.fields || []).map((field) => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{field}</label>
                <Input
                  type={field.toLowerCase().includes("key") || field.toLowerCase().includes("token") || field.toLowerCase().includes("secret") ? "password" : "text"}
                  placeholder={field}
                  value={field === "API Key" ? apiKey : (extraConfig[field] || "")}
                  onChange={e => {
                    if (field === "API Key") setApiKey(e.target.value);
                    else setExtraConfig(prev => ({ ...prev, [field]: e.target.value }));
                  }}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} disabled={saveApiKey.isPending} className="flex-1">
                {saveApiKey.isPending ? "Duke ruajtur..." : "Ruaj & Lidh"}
              </Button>
              {integration.status === "connected" && (
                <Button variant="destructive" onClick={handleDisconnect} disabled={disconnect.isPending}>
                  Shkëput
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
