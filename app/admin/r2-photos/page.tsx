import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function R2PhotosPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="headline mb-6 text-[30px]">Upload Photos</h1>
      <p className="text-sm text-muted mb-6">
        Photo uploads moved to the gallery&apos;s own admin, which extracts
        EXIF, generates thumbnails, and updates the gallery instantly — no
        rebuild needed.
      </p>
      <a
        href="https://pics.andypandy.org/admin/upload"
        className="inline-block bg-ink px-5 py-2.5 text-sm font-medium text-paper "
      >
        Open Gallery Uploader →
      </a>
    </div>
  );
}
