import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWebhookEvents } from "@/hooks/use-webhook-events";
import { Activity, Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "processed", "error"] as const;
type Status = typeof STATUSES[number];

const statusStyle: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  processed: "bg-success/15 text-success border-success/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function LogsPage() {
  const { data: events, isLoading } = useWebhookEvents();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const sources = useMemo(() => {
    const set = new Set<string>();
    events?.forEach(e => e.source && set.add(e.source));
    return Array.from(set);
  }, [events]);

  const filtered = useMemo(() => {
    return (events ?? []).filter(e => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.event_type ?? ""} ${e.source ?? ""} ${JSON.stringify(e.payload ?? {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, statusFilter, sourceFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: events?.length ?? 0 };
    STATUSES.forEach(s => { c[s] = (events ?? []).filter(e => e.status === s).length; });
    return c;
  }, [events]);

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Logs & Webhook Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time eventet hyrëse nga të gjitha kanalet — për debugging end-to-end.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {STATUSES.map(s => (
          <StatCard key={s} label={s} value={counts[s] ?? 0} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">{filtered.length} event(s)</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Kërko event type, payload..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 h-8 w-64 text-xs"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha burimet</SelectItem>
                  {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Asnjë event i gjetur. Eventet hyrëse nga webhooks do të shfaqen këtu në kohë reale.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event Type</TableHead>
                  <TableHead className="text-xs">Burimi</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Krijuar</TableHead>
                  <TableHead className="text-xs">Procesuar</TableHead>
                  <TableHead className="text-xs text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs font-medium">{e.event_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{e.source ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] border", statusStyle[e.status] ?? "")}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.processed_at ? new Date(e.processed_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" /> Shih
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-sm">
                              {e.event_type} — {e.source}
                            </DialogTitle>
                          </DialogHeader>
                          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card rounded-lg p-3 text-left transition-all border",
        active ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-border"
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </button>
  );
}
