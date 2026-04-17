import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare, Bot, User, Phone } from "lucide-react";
import {
  useConversations, useMessages, useSendTelegramMessage,
  useClaimTelegramBot, useTelegramOwner,
  useChannelSettings, useUpdateChannelSettings,
} from "@/hooks/use-messaging";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const channelIcon: Record<string, JSX.Element> = {
  telegram: <Send className="w-3 h-3" />,
  whatsapp: <Phone className="w-3 h-3" />,
  sms: <MessageSquare className="w-3 h-3" />,
};

export default function ConversationsPage() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const { data: owner } = useTelegramOwner();
  const claim = useClaimTelegramBot();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages } = useMessages(selectedId);
  const send = useSendTelegramMessage();
  const [draft, setDraft] = useState("");

  const { data: settings } = useChannelSettings("telegram");
  const updateSettings = useUpdateChannelSettings();

  const isOwner = owner?.owner_user_id === user?.id;
  const selected = conversations?.find(c => c.id === selectedId);

  const handleSend = () => {
    if (!selectedId || !draft.trim()) return;
    send.mutate({ conversation_id: selectedId, text: draft }, {
      onSuccess: () => setDraft(""),
    });
  };

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Conversations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mesazhe nga Telegram, WhatsApp, SMS — me përgjigje automatike me AI.
          </p>
        </div>
        {!owner?.owner_user_id ? (
          <Button onClick={() => claim.mutate()} disabled={claim.isPending} size="sm">
            <Bot className="w-3 h-3 mr-1" /> Kërko pronësinë e bot-it Telegram
          </Button>
        ) : isOwner ? (
          <Badge className="bg-success text-success-foreground">Ti je pronari i bot-it Telegram</Badge>
        ) : (
          <Badge variant="secondary">Bot-i i përket një user-i tjetër</Badge>
        )}
      </div>

      {/* Channel settings */}
      {isOwner && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Telegram — AI Auto-reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Përgjigju automatikisht me AI</p>
                <p className="text-xs text-muted-foreground">Lovable AI (Gemini) përgjigjet menjëherë në çdo mesazh hyrës.</p>
              </div>
              <Switch
                checked={settings?.ai_auto_reply ?? true}
                onCheckedChange={(v) => updateSettings.mutate({ channel: "telegram", ai_auto_reply: v })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">System prompt</label>
              <Textarea
                rows={2}
                defaultValue={settings?.system_prompt ?? ""}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== settings?.system_prompt) updateSettings.mutate({ channel: "telegram", system_prompt: v });
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-22rem)] min-h-[400px]">
        {/* Conversations list */}
        <Card className="glass-card md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Bisedat ({conversations?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-auto p-2 space-y-1">
            {isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-md" />)
              : !conversations?.length ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Asnjë bisedë ende. Dërgo një mesazh bot-it tënd në Telegram.
                </p>
              ) : conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors border border-transparent",
                    selectedId === c.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {channelIcon[c.channel]} {c.channel}
                    </Badge>
                    <span className="text-xs font-medium truncate">{c.contact_name || c.contact_handle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.contact_handle}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</p>
                </button>
              ))}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="glass-card md:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {selected ? (selected.contact_name || selected.contact_handle) : "Zgjidh një bisedë"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-2 p-4">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground text-center py-8">← Zgjidh një bisedë nga lista</p>
            ) : !messages?.length ? (
              <p className="text-xs text-muted-foreground text-center py-8">Pa mesazhe</p>
            ) : messages.map(m => (
              <div key={m.id} className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  m.direction === "outbound"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}>
                  <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                    {m.sender === "ai" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {m.sender} · {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))}
          </CardContent>
          {selectedId && (
            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Shkruaj një mesazh..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button onClick={handleSend} disabled={!draft.trim() || send.isPending} size="sm">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
