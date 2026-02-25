"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useSnack } from "@/components/ui/snack";

export function LogoutButton() {
  const router = useRouter();
  const snack = useSnack();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
          snack.error("No se pudo cerrar sesión", error.message);
          return;
        }

        snack.success("Sesión cerrada", "Hasta luego.");
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" /> Salir
    </Button>
  );
}
