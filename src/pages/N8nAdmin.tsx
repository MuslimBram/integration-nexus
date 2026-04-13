import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Workflow, Play, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  lastRun: string | null;
  status: "success" | "error" | "idle";
  eventType: string;
}

const mockWorkflows: N8nWorkflow[] = [
  { id: "1", name: "New Lead Handler", active: true, lastRun: "2 min ago", status: "success", eventType: "new_lead" },
  { id: "2", name: "Missed Call Follow-up", active: true, lastRun: "1 hr ago", status: "success", eventType: "missed_call" },
  { id: "3", name: "Payment Confirmation", active: false, lastRun: null, status: "idle", eventType: "payment_success" },
  { id: "4", name: "Abandoned Cart Recovery", active: true, lastRun: "30 min ago", status: "error", eventType: "abandoned_cart" },
  { id: "5", name: "AI Analysis Job", active: true, lastRun: "5 min ago", status: "success", eventType: "ai_analysis" },
  { id: "6", name: "Competitor Scan", active: false, lastRun: "1 day ago", status: "success", eventType: "competitor_scan" },
  { id: "7", name: "Content Generation", active: true, lastRun: "15 min ago", status: "success", eventType: "content_generation" },
  { id: "8", name: "Booking Request Handler", active: true, lastRun: "45 min ago", status: "success", eventType: "booking_request" },
  { id: "9", name: "Form Submit Processor", active: true, lastRun: "10 min ago", status: "success", eventType: "form_submit" },
  { id: "10", name: "Follow-up Reminder", active: false, lastRun: "2 hrs ago", status: "idle", eventType: "follow_up" },
];

const statusIcons = {
  success: <CheckCircle className="w-4 h-4 text-success" />,
  error: <XCircle className="w-4 h-4 text-destructive" />,
  idle: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function N8nAdmin() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(mockWorkflows);

  const handleTestConnection = () => {
    if (baseUrl && apiKey) setIsConnected(true);
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  };

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
            <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-success text-success-foreground" : ""}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">n8n Base URL</label>
              <Input placeholder="https://n8n.example.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">API Key</label>
              <Input type="password" placeholder="n8n-api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook Secret (optional)</label>
              <Input type="password" placeholder="webhook-secret" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestConnection} size="sm">
              <RefreshCw className="w-3 h-3 mr-1" /> Test Connection
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3 h-3 mr-1" /> Sync Workflows
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Mappings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Workflows ({workflows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workflows.map((wf) => (
              <div key={wf.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  {statusIcons[wf.status]}
                  <div>
                    <p className="text-sm font-medium text-foreground">{wf.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{wf.eventType}</Badge>
                      {wf.lastRun && <span className="text-[10px] text-muted-foreground">{wf.lastRun}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Play className="w-3 h-3" />
                  </Button>
                  <Switch checked={wf.active} onCheckedChange={() => toggleWorkflow(wf.id)} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
