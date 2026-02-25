"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSnack } from "@/components/ui/snack";

export function LoginForm() {
  const router = useRouter();
  const snack = useSnack();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      snack.error("No se pudo iniciar sesión", authError.message);
      setLoading(false);
      return;
    }

    snack.success("Sesión iniciada", "Acceso correcto.");
    router.replace("/app");
    router.refresh();
  };

  return (
    <Card className="mx-auto w-full max-w-md space-y-4 p-6">
      <CardTitle>Ingresar</CardTitle>
      <CardDescription>Accede con tu correo y contraseña</CardDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
