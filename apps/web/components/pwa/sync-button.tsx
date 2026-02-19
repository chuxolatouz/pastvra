"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/lib/db/hooks";
import { syncPendingWeights } from "@/lib/db/sync";

export function SyncButton({ userId }: { userId: string }) {
  const online = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleSync = async () => {
    if (!online || loading) return;
    setLoading(true);
    const result = await syncPendingWeights(userId);
    setMessage(`Sincronizados: ${result.synced} | Fallidos: ${result.failed}`);
    setLoading(false);
  };

  useEffect(() => {
    if (online) {
      handleSync().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return (
    <div className="space-y-2">
      <Button onClick={handleSync} disabled={!online || loading} variant="outline" size="lg">
        <RefreshCw className="h-5 w-5" /> Sincronizar
      </Button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
