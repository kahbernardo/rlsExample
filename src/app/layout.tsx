import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notas Secretas - RLS PoC",
  description: "Prova de conceito Row-Level Security com Next.js e Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
