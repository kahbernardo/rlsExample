import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/appHeader";
import { LanguageProvider } from "@/contexts/languageContext";
import { RlsStatusProvider } from "@/contexts/rlsStatusContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Validação RLS - PoC",
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
        <LanguageProvider>
          <RlsStatusProvider>
            <div className="flex min-h-screen">
              <AppHeader />
              <main className="min-w-0 flex-1 overflow-auto px-6 py-8">{children}</main>
            </div>
          </RlsStatusProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
