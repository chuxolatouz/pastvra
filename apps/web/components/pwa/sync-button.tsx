"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/lib/db/hooks";
import { syncPendingWeights } from "@/lib/db/sync";
import { useSnack } from "@/components/ui/snack";

export function SyncButton({ userId }: { userId: string }) {
  const online = useOnlineStatus();
  const snack = useSnack();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!online || loading) return;
    setLoading(true);
    const result = await syncPendingWeights(userId);
    if (result.failed > 0) {
      snack.error("Sincronización con errores", `Sincronizados: ${result.synced} | Fallidos: ${result.failed}`);
    } else {
      snack.success("Sincronización completada", `Registros sincronizados: ${result.synced}.`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (online) {
      handleSync().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return (
    <div>
      <Button onClick={handleSync} disabled={!online || loading} variant="outline" size="lg">
        <RefreshCw className="h-5 w-5" /> Sincronizar
      </Button>
    </div>
  );
}
