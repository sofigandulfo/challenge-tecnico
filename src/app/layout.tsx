import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS-Track",
  description: "Esqueleto inicial del proyecto SaaS-Track.",
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
