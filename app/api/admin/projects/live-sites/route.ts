import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  normalizeLiveSitesConfig,
  type LiveSitesConfig,
} from "@/lib/live-sites";
import { LIVE_SITES_KEY, projects } from "@/lib/projects";
import { r2Put } from "@/lib/r2-storage";

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<LiveSitesConfig>;
  try {
    body = (await req.json()) as Partial<LiveSitesConfig>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.order) || !Array.isArray(body.hidden)) {
    return Response.json(
      { error: "Order and hidden must be arrays" },
      { status: 400 },
    );
  }

  const config = normalizeLiveSitesConfig(projects, body);

  try {
    await r2Put(
      LIVE_SITES_KEY,
      JSON.stringify(config, null, 2),
      "application/json; charset=utf-8",
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 502 });
  }

  revalidateTag("live-projects");
  revalidatePath("/projects");
  revalidatePath("/admin");

  return Response.json({ ok: true, config });
}
