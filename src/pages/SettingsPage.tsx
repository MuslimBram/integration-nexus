import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <SEO
        title="Hub Settings — Konfigurime të Integrations Hub"
        description="Konfiguro instalimin PWA dhe preferencat e Integrations Hub në çdo pajisje: PC, tablet ose telefon."
        path="/settings"
      />
      <h1 className="text-2xl font-bold text-foreground">Hub Settings</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Instalimi i Aplikacionit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Integrations Hub mund të instalohet si aplikacion në çdo pajisje: PC, Tablet ose Telefon.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline">🖥️ PC</Button>
            <Button size="sm" variant="outline">📱 Telefon</Button>
            <Button size="sm" variant="outline">📟 Tablet</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kliko "Instalo" kur shfaqet popup-i i browser-it, ose shko te menu e browser-it → "Install App" / "Add to Home Screen".
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Rreth Aplikacionit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Integrations Hub — Faza 1: UI Dashboard + PWA. Fazat e ardhshme do të sjellin OAuth real, n8n backend, dhe edge functions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
