import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubTrack",
  description: "Claridad y control sobre tus gastos en suscripciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
