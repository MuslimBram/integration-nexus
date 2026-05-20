import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, Play, RefreshCw, CheckCircle, XCircle, Clock, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useN8nConfig,
  useN8nWorkflows,
  useSaveN8nConfig,
  useTestN8nConnection,
  useSyncN8nWorkflows,
  useToggleN8nWorkflow,
  useTriggerN8nWorkflow,
  useUpdateWorkflowMapping,
} from "@/hooks/use-n8n";

const EVENT_TYPES = [
  "new_lead", "new_message", "missed_call", "form_submit",
  "payment_success", "abandoned_cart", "booking_request",
  "follow_up", "ai_analysis", "competitor_scan", "content_generation",
];

const statusIcons: Record<string, JSX.Element> = {
  success: <CheckCircle className="w-4 h-4 text-success" />,
  active: <CheckCircle className="w-4 h-4 text-success" />,
  error: <XCircle className="w-4 h-4 text-destructive" />,
  idle: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function N8nAdmin() {
  const { data: config, isLoading: configLoading } = useN8nConfig();
  const { data: workflows, isLoading: wfLoading } = useN8nWorkflows();

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form from config
  if (config && !initialized) {
    setBaseUrl(config.base_url || "");
    setWebhookSecret(config.webhook_secret || "");
    setInitialized(true);
  }

  const saveConfig = useSaveN8nConfig();
  const testConnection = useTestN8nConnection();
  const syncWorkflows = useSyncN8nWorkflows();
  const toggleWorkflow = useToggleN8nWorkflow();
  const triggerWorkflow = useTriggerN8nWorkflow();
  const updateMapping = useUpdateWorkflowMapping();

  const handleSaveConfig = () => {
    saveConfig.mutate({ base_url: baseUrl, api_key: apiKey, webhook_secret: webhookSecret });
  };

  if (configLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Workflow className="w-6 h-6 text-primary" />
          n8n Automation Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automation backbone — menaxho workflows për të gjitha eventet
        </p>
      </div>

      {/* Connection Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Connection Settings
            <Badge variant={config?.is_connected ? "default" : "secondary"}
              className={config?.is_connected ? "bg-success text-success-foreground" : ""}>
              {config?.is_connected ? "Connected" : "Not Connected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">n8n Base URL</label>
              <Input placeholder="https://n8n.example.com" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">API Key</label>
              <Input type="password" placeholder="n8n-api-key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook Secret (optional)</label>
              <Input type="password" placeholder="webhook-secret" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSaveConfig} size="sm" disabled={saveConfig.isPending}>
              <Save className="w-3 h-3 mr-1" />
              {saveConfig.isPending ? "Duke ruajtur..." : "Ruaj"}
            </Button>
            <Button onClick={() => testConnection.mutate()} size="sm" variant="outline" disabled={testConnection.isPending || !config}>
              <RefreshCw className={`w-3 h-3 mr-1 ${testConnection.isPending ? "animate-spin" : ""}`} />
              Test Connection
            </Button>
            <Button onClick={() => syncWorkflows.mutate()} size="sm" variant="outline"
              disabled={syncWorkflows.isPending || !config?.is_connected}>
              <RefreshCw className={`w-3 h-3 mr-1 ${syncWorkflows.isPending ? "animate-spin" : ""}`} />
              Sync Workflows
            </Button>
          </div>
          {config?.last_sync && (
            <p className="text-[10px] text-muted-foreground">
              Last sync: {new Date(config.last_sync).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Workflows */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            Workflows ({workflows?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wfLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-md" />)}
            </div>
          ) : !workflows?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {config?.is_connected
                ? 'Klikoni "Sync Workflows" për të importuar workflows nga n8n.'
                : "Lidhuni me n8n për të parë workflows."}
            </p>
          ) : (
            <div className="space-y-2">
              {workflows.map(wf => (
                <div key={wf.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {statusIcons[wf.status] || statusIcons.idle}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{wf.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Select
                          value={wf.event_type || ""}
                          onValueChange={(val) => updateMapping.mutate({ workflow_id: wf.id, event_type: val })}
                        >
                          <SelectTrigger className="h-6 w-40 text-[10px]">
                            <SelectValue placeholder="Event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map(et => (
                              <SelectItem key={et} value={et} className="text-xs">{et}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {wf.last_run && (
                          <span className="text-[10px] text-muted-foreground">
                            Last: {new Date(wf.last_run).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => triggerWorkflow.mutate(wf.id)}
                      disabled={triggerWorkflow.isPending}
                      aria-label={`Aktivizo workflow-in ${wf.name}`}
                    >
                      <Play className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    <Switch
                      checked={wf.active}
                      onCheckedChange={(active) => toggleWorkflow.mutate({ workflow_id: wf.id, active })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
