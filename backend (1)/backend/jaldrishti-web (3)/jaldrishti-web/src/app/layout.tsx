import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

/**
 * Three faces, each with a job.
 *
 * Archivo carries display type — it holds tight tracking at large sizes, which
 * is what the reference's oversized headline needs. IBM Plex Sans runs body and
 * interface copy. IBM Plex Mono is restricted to figures and axis ticks so
 * numbers stay tabular and comparable down a column.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JalDrishti 2030 — water-stress planning for Bengaluru",
  description:
    "A decision-support prototype that forecasts neighbourhood water stress, tests interventions against a representative network, and traces every recommendation back to the data behind it.",
};

export const viewport: Viewport = {
  themeColor: "#f2f2ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
