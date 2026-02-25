"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type SnackTone = "success" | "error" | "info";

type SnackInput = {
  title: string;
  description?: string;
  tone?: SnackTone;
  durationMs?: number;
};

type SnackItem = SnackInput & {
  id: string;
  tone: SnackTone;
};

type SnackContextValue = {
  showSnack: (input: SnackInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const SnackContext = createContext<SnackContextValue | null>(null);

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function timeoutForTone(tone: SnackTone, custom?: number) {
  if (typeof custom === "number") return custom;
  if (tone === "error") return 6500;
  return 4200;
}

export function SnackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showSnack = useCallback(
    (input: SnackInput) => {
      const tone: SnackTone = input.tone ?? "info";
      const id = makeId();

      setItems((current) => [
        ...current,
        {
          id,
          title: input.title,
          description: input.description,
          tone,
          durationMs: input.durationMs,
        },
      ]);

      const delay = timeoutForTone(tone, input.durationMs);
      window.setTimeout(() => remove(id), delay);
    },
    [remove],
  );

  const value = useMemo<SnackContextValue>(
    () => ({
      showSnack,
      success: (title, description) => showSnack({ title, description, tone: "success" }),
      error: (title, description) => showSnack({ title, description, tone: "error" }),
      info: (title, description) => showSnack({ title, description, tone: "info" }),
    }),
    [showSnack],
  );

  return (
    <SnackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,420px)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-2xl border p-3 shadow-lg backdrop-blur transition",
              item.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              item.tone === "error" && "border-red-200 bg-red-50 text-red-900",
              item.tone === "info" && "border-sky-200 bg-sky-50 text-sky-900",
            )}
          >
            <div className="flex items-start gap-2">
              <ToneIcon tone={item.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.title}</p>
                {item.description ? <p className="text-xs opacity-90">{item.description}</p> : null}
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
                onClick={() => remove(item.id)}
              >
                Cerrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </SnackContext.Provider>
  );
}

function ToneIcon({ tone }: { tone: SnackTone }) {
  if (tone === "success") return <CheckCircle2 className="mt-0.5 h-4 w-4" />;
  if (tone === "error") return <AlertCircle className="mt-0.5 h-4 w-4" />;
  return <Info className="mt-0.5 h-4 w-4" />;
}

export function useSnack() {
  const value = useContext(SnackContext);
  if (!value) {
    throw new Error("useSnack debe usarse dentro de SnackProvider");
  }
  return value;
}
