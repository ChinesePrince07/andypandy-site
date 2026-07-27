import { NextRequest } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveExperienceEntries } from "@/lib/experience-store";
import type { Experience } from "@/lib/experience";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return Response.json({ error: "Expected an array" }, { status: 400 });
  }

  await saveExperienceEntries(body as Experience[]);
  revalidateTag("experience");
  revalidatePath("/");
  return Response.json({ ok: true });
}
