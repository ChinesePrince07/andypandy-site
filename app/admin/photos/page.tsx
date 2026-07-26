import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PhotoManager from "./photo-manager";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin");

  return (
    <div>
      <h1 className="headline mb-6 text-[30px]">Manage Photos</h1>
      <PhotoManager />
    </div>
  );
}
