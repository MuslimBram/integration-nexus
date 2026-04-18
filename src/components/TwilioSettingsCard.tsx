import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, Copy, Check } from "lucide-react";
import { useTwilioConfig, useSaveTwilioConfig } from "@/hooks/use-twilio";
import { useChannelSettings, useUpdateChannelSettings } from "@/hooks/use-messaging";
import { useToast } from "@/hooks/use-toast";

const PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export default function TwilioSettingsCard() {
  const { data: cfg } = useTwilioConfig();
  const save = useSaveTwilioConfig();
  const { toast } = useToast();
  const [sms, setSms] = useState("");
  const [wa, setWa] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSms(cfg?.sms_from_number ?? "");
    setWa(cfg?.whatsapp_from_number ?? "");
  }, [cfg]);

  const webhookUrl = cfg?.webhook_secret
    ? `https://${PROJECT_REF}.supabase.co/functions/v1/twilio-webhook?secret=${cfg.webhook_secret}`
    : "Ruaj konfigurimin për të gjeneruar webhook URL";

  const copyUrl = async () => {
    if (!cfg?.webhook_secret) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({ title: "Webhook URL u kopjua" });
    setTimeout(() => setCopied(false), 1500);
  };

  const smsAi = useChannelSettings("sms");
  const waAi = useChannelSettings("whatsapp");
  const updateAi = useUpdateChannelSettings();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" /> Twilio (SMS + WhatsApp)
          {cfg?.sms_from_number || cfg?.whatsapp_from_number ? (
            <Badge className="bg-success text-success-foreground">Aktiv</Badge>
          ) : (
            <Badge variant="outline">Pa konfiguruar</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">SMS From Number (E.164)</label>
            <Input value={sms} onChange={(e) => setSms(e.target.value)} placeholder="+15551234567" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp From Number (E.164)</label>
            <Input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="+14155238886" />
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => save.mutate({
            sms_from_number: sms || null,
            whatsapp_from_number: wa || null,
          })}
          disabled={save.isPending}
        >
          Ruaj konfigurimin
        </Button>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Webhook URL — vendose në Twilio Console (SMS & WhatsApp "When a message comes in")
          </label>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={copyUrl} disabled={!cfg?.webhook_secret}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          {[
            { key: "sms" as const, label: "SMS", data: smsAi.data },
            { key: "whatsapp" as const, label: "WhatsApp", data: waAi.data },
          ].map(({ key, label, data }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{label} — AI Auto-reply</p>
                <Switch
                  checked={data?.ai_auto_reply ?? true}
                  onCheckedChange={(v) => updateAi.mutate({ channel: key, ai_auto_reply: v })}
                />
              </div>
              <Textarea
                rows={2}
                placeholder="System prompt..."
                defaultValue={data?.system_prompt ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== data?.system_prompt)
                    updateAi.mutate({ channel: key, system_prompt: e.target.value });
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
