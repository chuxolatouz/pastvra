"use client";

import { WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus, usePendingCount } from "@/lib/db/hooks";

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const pending = usePendingCount();

  return (
    <div className="flex items-center gap-2">
      {!online && (
        <Badge className="border-amber-400 bg-amber-100 text-amber-800">
          <WifiOff className="mr-1 h-3 w-3" /> Offline
        </Badge>
      )}
      {pending > 0 && <Badge className="border-sky-300 bg-sky-100 text-sky-800">Pendientes: {pending}</Badge>}
    </div>
  );
}
