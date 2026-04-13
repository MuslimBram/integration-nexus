import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast({ title: "Mirësevini!", description: "U identifikuat me sukses." });
      } else {
        await signUp(email, password);
        toast({ title: "Sukses!", description: "Kontrolloni emailin tuaj për verifikim." });
      }
    } catch (error: any) {
      toast({ title: "Gabim", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🔗</div>
          <CardTitle className="text-2xl">Integrations Hub</CardTitle>
          <CardDescription>
            {isLogin ? "Identifikohuni për të vazhduar" : "Krijoni një llogari të re"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Duke ngarkuar..." : isLogin ? "Hyr" : "Regjistrohu"}
            </Button>
          </form>
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Nuk keni llogari? Regjistrohuni" : "Keni llogari? Hyni"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
