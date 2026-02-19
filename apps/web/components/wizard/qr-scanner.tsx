"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

export function QrScanner({ onDetected }: { onDetected: (value: string) => void }) {
  const containerId = "qr-reader";
  const [active, setActive] = useState(false);
  const scanner = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scanner.current?.isScanning) {
        scanner.current.stop().catch(() => undefined);
      }
    };
  }, []);

  const start = async () => {
    if (active) return;
    scanner.current = new Html5Qrcode(containerId);
    try {
      await scanner.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onDetected(decodedText.trim());
        },
        () => undefined,
      );
      setActive(true);
    } catch {
      setActive(false);
    }
  };

  const stop = async () => {
    if (!scanner.current?.isScanning) return;
    await scanner.current.stop();
    setActive(false);
  };

  return (
    <div className="space-y-2">
      <div id={containerId} className="min-h-40 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
      <div className="flex gap-2">
        <Button type="button" onClick={start} disabled={active} variant="secondary">
          Iniciar cámara
        </Button>
        <Button type="button" onClick={stop} disabled={!active} variant="outline">
          Detener
        </Button>
      </div>
    </div>
  );
}
