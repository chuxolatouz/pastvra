"use client";

import { useEffect, useState } from "react";
import { db } from "./offline";

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

export function usePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = async () => setCount(await db.pending_weights.count());
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);

  return count;
}
