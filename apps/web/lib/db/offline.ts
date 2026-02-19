"use client";

import Dexie, { type EntityTable } from "dexie";

export type PendingWeight = {
  client_generated_id: string;
  farm_id: string;
  animal_id: string;
  weighed_at: string;
  weight_kg: number;
  created_at: string;
};

export type AnimalCache = {
  id: string;
  farm_id: string;
  chip_id: string | null;
  ear_tag: string | null;
  name: string | null;
  photo_path: string | null;
  last_weight_kg: number | null;
  last_weighed_at: string | null;
};

const db = new Dexie("pastvra") as Dexie & {
  pending_weights: EntityTable<PendingWeight, "client_generated_id">;
  animal_cache: EntityTable<AnimalCache, "id">;
};

db.version(1).stores({
  pending_weights: "client_generated_id, farm_id, animal_id, created_at",
  animal_cache: "id, farm_id, chip_id, ear_tag",
});

export { db };
