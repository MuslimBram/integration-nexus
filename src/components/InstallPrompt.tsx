import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const install = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm animate-in slide-in-from-bottom-4">
      <Download className="w-8 h-8 text-primary flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-card-foreground">Instalo Integrations Hub</p>
        <p className="text-xs text-muted-foreground">Shkarko si aplikacion në pajisjen tënde</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={install}>Instalo</Button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
