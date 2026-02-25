import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(2, "Nombre de finca requerido"),
  hectares: z.coerce.number().nullable().optional(),
  low_gain_threshold_adg: z.coerce.number().positive().optional(),
  overdue_days: z.coerce.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const bodyResult = bodySchema.safeParse(await request.json());
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const { data: adminMemberships, error: membershipsError } = await session
    .from("farm_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .eq("role", "admin")
    .limit(1);

  if (membershipsError) {
    return NextResponse.json({ error: membershipsError.message }, { status: 400 });
  }

  if (!adminMemberships?.length) {
    return NextResponse.json({ error: "Solo un administrador puede crear nuevas fincas" }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL" }, { status: 400 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  const { name, hectares, low_gain_threshold_adg, overdue_days } = bodyResult.data;

  const farmInsert = await admin
    .from("farms")
    .insert({
      name,
      hectares: hectares ?? null,
      low_gain_threshold_adg: low_gain_threshold_adg ?? 0.3,
      overdue_days: overdue_days ?? 45,
    })
    .select("id")
    .single();

  if (farmInsert.error || !farmInsert.data) {
    return NextResponse.json({ error: farmInsert.error?.message ?? "No se pudo crear la finca" }, { status: 400 });
  }

  const membershipInsert = await admin.from("farm_memberships").insert({
    farm_id: farmInsert.data.id,
    user_id: user.id,
    role: "admin",
    active: true,
  });

  if (membershipInsert.error) {
    await admin.from("farms").delete().eq("id", farmInsert.data.id);
    return NextResponse.json({ error: membershipInsert.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, farmId: farmInsert.data.id });
}
