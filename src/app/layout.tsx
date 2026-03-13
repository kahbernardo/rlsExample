import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeSwitcher } from "@/components/themeSwitcher";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakarta.className} antialiased min-h-screen`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('rls-example-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');})();`,
          }}
        />
        <header className="sticky top-0 z-10 flex items-center justify-end border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 dark:border-border dark:bg-surface/95">
          <ThemeSwitcher />
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
