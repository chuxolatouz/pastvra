import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { assertAdminForFarm } from "@/lib/supabase/admin-guard";

const bodySchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "supervisor", "operador"]),
  farmId: z.uuid(),
});

async function findUserByEmail(admin: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return { user: null, error: error.message };

    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (found) return { user: found, error: null };

    if (data.users.length < 100) break;
  }

  return { user: null, error: null };
}

export async function POST(request: Request) {
  const bodyResult = bodySchema.safeParse(await request.json());
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const { email, role, farmId } = bodyResult.data;
  const guard = await assertAdminForFarm(farmId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL" }, { status: 400 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  const existing = await findUserByEmail(admin, email);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }

  let userId = existing.user?.id;
  let invitationSent = false;

  if (!userId) {
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    userId = inviteData.user?.id;
    invitationSent = true;
  }

  if (!userId) {
    return NextResponse.json({ error: "No se pudo resolver el user_id" }, { status: 500 });
  }

  const membershipUpsert = await admin.from("farm_memberships").upsert(
    {
      farm_id: farmId,
      user_id: userId,
      role,
      active: true,
    },
    { onConflict: "farm_id,user_id" },
  );

  if (membershipUpsert.error) {
    return NextResponse.json({ error: membershipUpsert.error.message }, { status: 400 });
  }

  const profileUpsert = await admin.from("profiles").upsert(
    {
      user_id: userId,
      email,
    },
    { onConflict: "user_id" },
  );

  if (profileUpsert.error) {
    return NextResponse.json({ error: profileUpsert.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId, invitationSent });
}
