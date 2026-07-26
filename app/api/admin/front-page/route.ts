import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-auth";
import { applyOp } from "@/lib/front-page";
import { getFrontPageConfig, saveFrontPageConfig } from "@/lib/front-page-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let next;
  try {
    // applyOp validates against the allowlist and throws on anything unknown.
    next = applyOp(await getFrontPageConfig(), await req.json());
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: 400 },
    );
  }

  await saveFrontPageConfig(next);
  revalidateTag("front-page");
  return Response.json({ ok: true, config: next });
}
