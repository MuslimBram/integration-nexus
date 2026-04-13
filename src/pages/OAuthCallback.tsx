import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState("Duke procesuar OAuth...");

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        setStatus(`OAuth dështoi: ${error}`);
        toast({ title: "OAuth Error", description: error, variant: "destructive" });
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      if (!code || !state) {
        setStatus("Parametra të pavlefshëm.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/oauth/callback`;
        const { data, error: fnError } = await supabase.functions.invoke("oauth-handler?action=callback", {
          body: { code, state, redirect_uri: redirectUri },
        });

        if (fnError) throw fnError;
        if (data?.success) {
          toast({ title: "Sukses!", description: "Integrimi u lidh me sukses." });
        } else {
          throw new Error(data?.error || "Unknown error");
        }
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }

      navigate("/");
    };

    processCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <p className="text-foreground">{status}</p>
      </div>
    </div>
  );
}
