import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Rail from "@/components/rail";
import BroadsheetFx from "@/components/broadsheet-fx";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Andy Zhang",
    template: "%s | Andy Zhang",
  },
  description: "Personal site & blog",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="EditURI"
          type="application/rsd+xml"
          title="RSD"
          href="/xmlrpc.php?rsd"
        />
        <link rel="https://api.w.org/" href="/wp-json/" />
        <link rel="micropub" href="/api/micropub" />
        <link rel="authorization_endpoint" href="/api/auth" />
        <link rel="token_endpoint" href="/api/token" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="relative min-h-screen bg-paper text-ink antialiased">
        {/* Paper light. Kept in its own clipping layer so the sticky
            dateline below still resolves against the viewport. */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            data-glow
            className="absolute left-0 top-0 -ml-[500px] -mt-[500px] h-[1000px] w-[1000px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--glow), transparent 64%)",
            }}
          />
        </div>

        <div className="relative z-[2] flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1 items-stretch">
            <Rail />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
          <Footer />
        </div>

        <BroadsheetFx />
      </body>
    </html>
  );
}
