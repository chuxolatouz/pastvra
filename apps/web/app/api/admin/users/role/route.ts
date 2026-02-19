import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminForFarm } from "@/lib/supabase/admin-guard";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  userId: z.uuid(),
  farmId: z.uuid(),
  role: z.enum(["admin", "supervisor", "operador"]),
});

export async function PATCH(request: Request) {
  const bodyResult = bodySchema.safeParse(await request.json());
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const { userId, farmId, role } = bodyResult.data;
  const guard = await assertAdminForFarm(farmId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const session = await createSessionClient();
  const { error } = await session
    .from("farm_memberships")
    .update({ role })
    .eq("farm_id", farmId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
