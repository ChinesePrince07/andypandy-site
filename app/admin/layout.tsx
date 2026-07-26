/**
 * The public pages run edge-to-edge, so <main> no longer carries a gutter.
 * The desk pages still want a measure — one wrapper beats padding six roots.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-11">
      {children}
    </div>
  );
}
