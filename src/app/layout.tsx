import type { Metadata } from "next";
import { VT323, Space_Mono } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetroLogger — Tu colección de videojuegos",
  description: "Plataforma de gestión de colecciones de videojuegos y seguimiento de precios en tiempo real.",
};

import Providers from "@/lib/react-query/provider";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { ToastProvider } from "@/context/ToastContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="es"
      className={`${vt323.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Providers>
          <ToastProvider>
            <Navbar user={user} />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
