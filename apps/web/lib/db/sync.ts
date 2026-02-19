"use client";

import { createClient } from "@/lib/supabase/client";
import { db } from "./offline";

export async function syncPendingWeights(userId: string) {
  const supabase = createClient();
  const pending = await db.pending_weights.orderBy("created_at").toArray();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const { error } = await supabase.from("animal_weights").insert({
      farm_id: item.farm_id,
      animal_id: item.animal_id,
      weighed_at: item.weighed_at,
      weight_kg: item.weight_kg,
      client_generated_id: item.client_generated_id,
      source: "offline_sync",
      created_by: userId,
    });

    if (error) {
      if (error.code === "23505") {
        await db.pending_weights.delete(item.client_generated_id);
        synced += 1;
      } else {
        failed += 1;
      }
    } else {
      await db.pending_weights.delete(item.client_generated_id);
      synced += 1;
    }
  }

  return { synced, failed };
}
