import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }, { status: 400 });
  }

  const sessionClient = await createServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as { email?: string; farmId?: string; role?: string };
  if (!body.email || !body.farmId || !body.role) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  const { data: membership } = await sessionClient
    .from("farm_memberships")
    .select("role")
    .eq("farm_id", body.farmId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const invite = await admin.auth.admin.inviteUserByEmail(body.email);
  if (invite.error || !invite.data.user) {
    return NextResponse.json({ error: invite.error?.message ?? "No se pudo invitar" }, { status: 400 });
  }

  const addMembership = await admin.from("farm_memberships").insert({
    farm_id: body.farmId,
    user_id: invite.data.user.id,
    role: body.role,
  });

  if (addMembership.error) {
    return NextResponse.json({ error: addMembership.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
