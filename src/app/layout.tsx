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
  title: "GameTracker Retro",
  description: "Plataforma de gestión de colecciones de videojuegos y seguimiento de precios en tiempo real.",
};

import Providers from "@/lib/react-query/provider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${vt323.variable} ${spaceMono.variable} h-full antialiased font-mono`}
    >
      <body className="min-h-full h-screen overflow-hidden flex bg-[#050505] text-white">
        <Providers>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-[#050505]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
