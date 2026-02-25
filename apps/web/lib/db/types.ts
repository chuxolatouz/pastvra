export type Role = "admin" | "supervisor" | "operador";

export type Farm = {
  id: string;
  name: string;
  hectares: number | null;
  low_gain_threshold_adg: number;
  overdue_days: number;
};

export type Membership = {
  id: string;
  farm_id: string;
  user_id: string;
  role: Role;
  active: boolean;
  created_at: string;
};

export type Paddock = {
  id: string;
  farm_id: string;
  code: string;
  hectares: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type SoilTest = {
  id: string;
  farm_id: string;
  paddock_id: string;
  tested_at: string;
  ph: number | null;
  grass_percent: number | null;
  sugar_percent: number | null;
  notes: string | null;
};

export type Animal = {
  id: string;
  farm_id: string;
  rubro: "bovino" | "bufalino";
  chip_id: string | null;
  ear_tag: string | null;
  name: string | null;
  sex: "M" | "H";
  breed: string | null;
  birth_date: string;
  cost: number | null;
  status: "vivo" | "vendido" | "muerto" | "extraviado";
  notes: string | null;
  photo_path: string | null;
  current_paddock_id: string | null;
  sire_id: string | null;
  dam_id: string | null;
  sire_external: string | null;
  dam_external: string | null;
};

export type AnimalWeight = {
  id: string;
  farm_id: string;
  animal_id: string;
  weighed_at: string;
  weight_kg: number;
  client_generated_id: string;
  source: string;
  source_row_hash: string | null;
  created_by: string;
  created_at: string;
};

export type AnimalEvent = {
  id: string;
  farm_id: string;
  animal_id: string;
  event_type:
    | "vacuna"
    | "desparasitacion"
    | "parto"
    | "venta"
    | "compra"
    | "traslado_potrero"
    | "otro";
  event_at: string;
  payload: Record<string, unknown> | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type Profile = {
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: string;
  farm_id: string;
  movement_date: string;
  partner_name: string | null;
  destination_name: string | null;
  category_name: string | null;
  opening_balance: number | null;
  purchases_qty: number | null;
  sales_qty: number | null;
  transfers_qty: number | null;
  unit_value_usd: number | null;
  observed_weight_kg: number | null;
  price_per_kg: number | null;
  kg_negotiated: number | null;
  freight_usd: number | null;
  commission_rate: number | null;
  notes: string | null;
  source: string;
  source_row_hash: string | null;
  sales_usd: number;
  purchases_usd: number;
  transfers_usd: number;
  commission_usd: number;
  total_acquisition_usd: number;
  net_delta_qty: number;
  created_by: string;
  created_at: string;
};
