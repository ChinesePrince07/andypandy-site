import { notFound } from "next/navigation";
import Link from "next/link";
import { getPhotoBySlug } from "@/lib/photos";
import { isAdmin } from "@/lib/admin-auth";
import ExifEditor from "@/components/exif-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) return {};
  return { title: photo.title || photo.slug };
}

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) notFound();

  const admin = await isAdmin();

  const cameraInfo = [photo.make, photo.model].filter(Boolean).join(" ");
  const exposureInfo = [
    photo.aperture ? `f/${photo.aperture}` : null,
    photo.shutter_speed ? `${photo.shutter_speed}s` : null,
    photo.iso ? `ISO ${photo.iso}` : null,
    photo.focal_length ? `${photo.focal_length}mm` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="space-y-8 px-4 py-10 sm:px-11">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/photos"
          className="inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-muted"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to photos
        </Link>
      </div>

      {/* Photo */}
      <div className="overflow-hidden ">
        <img
          src={photo.url}
          alt={photo.title || photo.slug}
          className="w-full "
        />
      </div>

      {/* Title & date */}
      {(photo.title || photo.taken_at) && (
        <div className="space-y-1">
          {photo.title && (
            <h1 className="headline text-[34px]">{photo.title}</h1>
          )}
          {photo.taken_at && (
            <time className="text-sm text-faint font-mono ">
              {new Date(photo.taken_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      )}

      {/* Camera & exposure summary */}
      {(cameraInfo || exposureInfo) && (
        <div className="space-y-1">
          {cameraInfo && (
            <p className="text-sm font-medium text-muted ">
              {cameraInfo}
            </p>
          )}
          {exposureInfo && (
            <p className="text-sm text-faint font-mono ">
              {exposureInfo}
            </p>
          )}
          {photo.lens && (
            <p className="text-xs text-faint ">{photo.lens}</p>
          )}
        </div>
      )}

      {/* EXIF detail panel + map — inline editing for admins */}
      <ExifEditor photo={photo} isAdmin={admin} />
    </div>
  );
}
