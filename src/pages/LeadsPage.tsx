import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useLeads, useUpdateLeadStatus } from "@/hooks/use-leads";
import { Users, Send, Phone, MessageSquare, ExternalLink, Search } from "lucide-react";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

const channelIcon: Record<string, JSX.Element> = {
  telegram: <Send className="w-3 h-3" />,
  whatsapp: <Phone className="w-3 h-3" />,
  sms: <MessageSquare className="w-3 h-3" />,
};

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;
type Status = typeof STATUSES[number];

const statusStyle: Record<Status, string> = {
  new: "bg-info/15 text-info border-info/30",
  contacted: "bg-warning/15 text-warning border-warning/30",
  qualified: "bg-primary/15 text-primary border-primary/30",
  converted: "bg-success/15 text-success border-success/30",
  lost: "bg-muted text-muted-foreground border-border",
};

export default function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const channels = useMemo(() => {
    const set = new Set<string>();
    leads?.forEach(l => l.channel && set.add(l.channel));
    return Array.from(set);
  }, [leads]);

  const filtered = useMemo(() => {
    return (leads ?? []).filter(l => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (channelFilter !== "all" && l.channel !== channelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.contact_name ?? ""} ${l.contact_handle ?? ""} ${l.message ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, channelFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads?.length ?? 0 };
    STATUSES.forEach(s => { c[s] = (leads ?? []).filter(l => l.status === s).length; });
    return c;
  }, [leads]);

  return (
    <div className="space-y-4 max-w-7xl">
      <SEO
        title="Leads — Ndjekje lead-esh shumë-kanalëshe | Integrations Hub"
        description="Lead-et e mbledhura nga Telegram, WhatsApp dhe SMS me filtra, kërkim dhe status updates në kohë reale."
        path="/leads"
      />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Leads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lead-et e mbledhura nga të gjitha kanalet — Telegram, WhatsApp, SMS.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {STATUSES.map(s => (
          <StatCard
            key={s}
            label={s}
            value={counts[s] ?? 0}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">{filtered.length} lead(s)</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Kërko emër, kontakt, mesazh..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 h-8 w-64 text-xs"
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha kanalet</SelectItem>
                  {channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              Asnjë lead i gjetur. Mesazhet e reja hyrëse do të krijojnë automatikisht lead-e.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Kontakt</TableHead>
                  <TableHead className="text-xs">Kanal</TableHead>
                  <TableHead className="text-xs">Mesazh</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Krijuar</TableHead>
                  <TableHead className="text-xs text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      <div className="font-medium">{l.contact_name || "—"}</div>
                      <div className="text-muted-foreground">{l.contact_handle || "—"}</div>
                    </TableCell>
                    <TableCell>
                      {l.channel ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {channelIcon[l.channel]} {l.channel}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">{l.source}</span>}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={l.message ?? ""}>
                      {l.message || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.status}
                        onValueChange={(v) => updateStatus.mutate({ id: l.id, status: v })}
                      >
                        <SelectTrigger className={cn("h-7 text-[10px] w-28 border", statusStyle[l.status as Status] ?? "")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {l.conversation_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => navigate(`/conversations?c=${l.conversation_id}`)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> Hap
                        </Button>
                      )}
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
